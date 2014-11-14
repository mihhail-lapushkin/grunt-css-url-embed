module.exports = function(grunt) {
  var URL_REGEX = /url\(["']?([^"'\(\)]+?)["']?\)[};,\s](?!\s*?\/\*\s*?noembed\s*?\*\/)/;
  var URL_EXCLUDE_REGEX = /^data:/;
  var REMOTE_URL_REGEX = /^(http|https):/;
  
  var fs = require('fs');
  var path = require('path');
  var units = require('node-units');
  var request = require('request');
  var mmmagic = require('mmmagic');
  var mimeType = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE);
  
  function isTooBig(size, options) {
    return options.skipUrlsLargerThan && size > units.convert(options.skipUrlsLargerThan + ' to B');
  }
  
  function embedUrlAndGoToNext(url, urlContent, fileContent, nextUrl) {
    var urlContentInBuffer = new Buffer(urlContent);
    
    mimeType.detect(urlContentInBuffer, function(error, mimeType) {
      if (error) {
        mimeType = 'application/octet-stream';
        grunt.log.warn('Failed to get MIME type of "' + url + '". Defaulting to "' + mimeType + '".');
      }
      
      var base64Content = urlContentInBuffer.toString('base64');
      var dataUri = '("data:' + mimeType + ';base64,' + base64Content + '")';
      var escapedUrl = url.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
      var embedUrlRegex = '\\([\'"]?' + escapedUrl + '[\'"]?\\)';
      
      fileContent.content = fileContent.content.replace(new RegExp(embedUrlRegex, 'g'), dataUri);
      
      grunt.log.ok('"' + url + '" embedded');
      
      nextUrl();
    });
  }

  function processNextUrl(fileContent, currentUrlIndex, urlArray, options, baseDir, isVerbose, finishCallback) {
    if (++currentUrlIndex === urlArray.length) {
      finishCallback();
    } else {
      processUrl(fileContent, currentUrlIndex, urlArray, options, baseDir, isVerbose, finishCallback);
    }
  }
  
  function processUrl(fileContent, currentUrlIndex, urlArray, options, baseDir, isVerbose, finishCallback) {
    var url = urlArray[currentUrlIndex];
    var nextUrl = processNextUrl.bind(null,
                                      fileContent, currentUrlIndex, urlArray, options, baseDir, isVerbose, finishCallback);
    
    try {
      if (isVerbose) {
        grunt.log.writeln('\n[ #' + (currentUrlIndex + 1) + ' ]');
      }
      
      if (REMOTE_URL_REGEX.test(url)) {
        request({ url: url, encoding: null }, function(error, response, body) {
          if (error || response.statusCode !== 200) {
            var failedUrlMessage = '"' + url + '" request failed';
            
            if (options.failOnMissingUrl) {
              grunt.fail.warn(failedUrlMessage + '\n');
            }
            
            if (error) {
              grunt.log.error(error);
            }
            
            grunt.log.warn(failedUrlMessage);
            
            return nextUrl();
          }
          
          if (isTooBig(body.length, options)) {
            grunt.log.warn('"' + url + '" is too big');
            
            return nextUrl();
          }
          
          embedUrlAndGoToNext(url, body, fileContent, nextUrl);
        });
      } else {
        var noArgumentUrl = url;
        
        if (url.indexOf('?') >= 0) {
          noArgumentUrl = url.split('?')[0];
          
          if (isVerbose) {
            grunt.log.writeln('"' + url + '" trimmed to "' + noArgumentUrl + '"');
          }
        }
        
        var urlFullPath = path.resolve(baseDir + '/' + noArgumentUrl);
        
        if (isVerbose) {
          grunt.log.writeln('"' + url + '" resolved to "' + urlFullPath + '"');
        }
        
        if (!grunt.file.exists(urlFullPath)) {
          var missingUrlMessage = '"' + (isVerbose ? urlFullPath : url) + '" not found on disk';
          
          if (options.failOnMissingUrl) {
            grunt.fail.warn(missingUrlMessage + '\n');
          }
          
          grunt.log.warn(missingUrlMessage);
          
          return nextUrl();
        }
        
        var urlFileSize = fs.statSync(urlFullPath)['size'];
        
        if (isTooBig(urlFileSize, options)) {
          grunt.log.warn('"' + (isVerbose ? urlFullPath : url) + '" is too big');
          
          return nextUrl();
        }
        
        var urlContent = fs.readFileSync(urlFullPath);
        
        embedUrlAndGoToNext(url, urlContent, fileContent, nextUrl);
      }
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('Failed to embed "' + url + '"\n');
    }
  }
  
  function processFile(fileSrc, fileDest, options, callback) {
    try {
      grunt.log.subhead('Processing source file "' + fileSrc + '"');
      
      var fileContent = grunt.file.read(fileSrc);
      var isVerbose = grunt.option('verbose');
      var baseDir = path.resolve(options.baseDir ? options.baseDir : path.dirname(fileSrc));
      var urlRegex = new RegExp(URL_REGEX.source, 'g');
      var allUrls = [];
      var urlMatch;
      
      while ((urlMatch = urlRegex.exec(fileContent))) {
        allUrls.push(urlMatch[1]);
      }
      
      var embeddableUrls = allUrls.filter(function(url) { return !url.match(URL_EXCLUDE_REGEX); });
      
      if (embeddableUrls.length === 0) {
        grunt.log.writeln("Nothing to embed here!");
        return;
      }
      
      if (isVerbose) {
        grunt.log.writeln('Using "' + baseDir + '" as base directory for URLs');
      }
      
      var uniqueEmbeddableUrls = grunt.util._.uniq(embeddableUrls);
      
      grunt.log.writeln(uniqueEmbeddableUrls.length + ' embeddable URL' + (uniqueEmbeddableUrls.length > 1 ? 's' : '') + ' found');
      
      var fileContentRef = { content: fileContent };
      
      processUrl(fileContentRef, 0, uniqueEmbeddableUrls, options, baseDir, isVerbose, function() {
        grunt.file.write(fileDest, fileContentRef.content);
        grunt.log.writeln('File "' + fileDest + '" created');
      });
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('URL embedding failed\n');
    }
  }
  
  grunt.registerMultiTask('cssUrlEmbed', "Embed URLs as base64 strings inside your stylesheets", function() {
    var async = this.async();
    
    var options = this.options({
      failOnMissingUrl: true
    });
    
    var existingFiles = this.files.filter(function(file) {
      if (!grunt.file.exists(file.src[0])) {
        return false;
      }
      
      return true;
    });
    
    var leftToProcess = existingFiles.length;
    
    existingFiles.forEach(function(file) {
      processFile(file.src[0], file.dest, options, function() {
        if (--leftToProcess === 0) {
          async();
        }
      });
    });
  });
};

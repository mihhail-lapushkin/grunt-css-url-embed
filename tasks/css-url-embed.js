module.exports = function(grunt) {
  var BASE_URL_REGEX = 'url\\(\\s*?["\']?([^"\'\\(\\)]+?)["\']?\\s*?\\)[};,!\\s]';
  var EXCLUSIVE_URL_REGEX = BASE_URL_REGEX + '(?!\\s*?\\/\\*\\s*?noembed\\s*?\\*\\/)';
  var INCLUSIVE_URL_REGEX = BASE_URL_REGEX + '\\s*?\\/\\*\\s*?embed\\s*?\\*\\/';
  var EMBEDDABLE_URL_REGEX = /^data:/;
  var REMOTE_URL_REGEX = /^(http|https):/;
  
  var fs = require('fs');
  var path = require('path');
  var units = require('node-units');
  var request = require('request');
  var mime = require('mime');
  
  var mmmagicMimeType;
  
  try {
    var mmmagic = require('mmmagic');
    mmmagicMimeType = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE);
  } catch (e) {}
  
  function isTooBig(size, options) {
    return options.skipUrlsLargerThan && size > units.convert(options.skipUrlsLargerThan + ' to B');
  }
  
  function embedUrlAndGoToNext(url, urlContentInBuffer, mimeType, fileContent, nextUrl) {
    var base64Content = urlContentInBuffer.toString('base64');
    var dataUri = '("data:' + mimeType + ';base64,' + base64Content + '")';
    var escapedUrl = url.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    var embedUrlRegex = '\\(\\s*?[\'"]?' + escapedUrl + '[\'"]?\\s*?\\)';
    
    fileContent.content = fileContent.content.replace(new RegExp(embedUrlRegex, 'g'), dataUri);
    
    grunt.log.ok('"' + url + '" embedded');
    
    nextUrl();
  }
  
  function resolveMimeTypeEmbedUrlAndGoToNext(url, urlContent, fileContent, nextUrl, options) {
    var urlContentInBuffer = new Buffer(urlContent);
    
    if (mmmagicMimeType && options.useMimeTypeSniffing) {
      mmmagicMimeType.detect(urlContentInBuffer, function(error, mimeType) {
        if (error) {
          mimeType = 'application/octet-stream';
          grunt.log.warn('Failed to get MIME-type of "' + url + '". Defaulting to "' + mimeType + '".');
        }
        
        embedUrlAndGoToNext(url, urlContentInBuffer, mimeType, fileContent, nextUrl);
      });
    } else {
      embedUrlAndGoToNext(url, urlContentInBuffer, mime.lookup(url), fileContent, nextUrl);
    }
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
    var nextUrl = processNextUrl.bind(null, fileContent, currentUrlIndex, urlArray, options, baseDir, isVerbose, finishCallback);
    
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
          
          resolveMimeTypeEmbedUrlAndGoToNext(url, body, fileContent, nextUrl, options);
        });
      } else {
        var noArgumentUrl = url;
        
        if (url.indexOf('?') >= 0) {
          noArgumentUrl = url.split('?')[0];
          
          if (isVerbose) {
            grunt.log.writeln('"' + url + '" trimmed to "' + noArgumentUrl + '"');
          }
        }
        
        // Fix url like "url('../fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular')"
        if (noArgumentUrl.indexOf('#') >= 0) {
          var noArgumentUrlOld = noArgumentUrl;
          noArgumentUrl = noArgumentUrl.split('#')[0];
          
          if (isVerbose) {
            grunt.log.writeln('"' + noArgumentUrlOld + '" trimmed to "' + noArgumentUrl + '"');
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

        if (!grunt.file.isFile(urlFullPath)) {
          if (isVerbose) {
            grunt.log.warn('"' + urlFullPath + '" is a folder');
          }

          return nextUrl();
        }
        
        var urlFileSize = fs.statSync(urlFullPath)['size'];
        
        if (isTooBig(urlFileSize, options)) {
          grunt.log.warn('"' + (isVerbose ? urlFullPath : url) + '" is too big');
          
          return nextUrl();
        }
        
        var urlContent = fs.readFileSync(urlFullPath);
        
        resolveMimeTypeEmbedUrlAndGoToNext(url, urlContent, fileContent, nextUrl, options);
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
      var urlRegex = new RegExp(options.inclusive ? INCLUSIVE_URL_REGEX : EXCLUSIVE_URL_REGEX, 'g');
      var allUrls = [];
      var urlMatch;
      
      while ((urlMatch = urlRegex.exec(fileContent))) {
        allUrls.push(urlMatch[1].trim());
      }
      
      var embeddableUrls = allUrls.filter(function(url) { return !url.match(EMBEDDABLE_URL_REGEX); });
      
      if (embeddableUrls.length === 0) {
        grunt.file.write(fileDest, fileContent);
        grunt.log.writeln('Nothing to embed here!');
        grunt.log.writeln('File "' + fileDest + '" created');
        return callback();
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
        callback();
      });
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('URL embedding failed\n');
    }
  }
  
  grunt.registerMultiTask('cssUrlEmbed', "Embed URLs as base64 strings inside your stylesheets", function() {
    var async = this.async();
    
    var options = this.options({
      failOnMissingUrl: true,
      inclusive: false,
      useMimeTypeSniffing: true
    });
    
    var existingFiles = this.files.filter(function(file) {
      if (!grunt.file.exists(file.src[0])) {
        return false;
      }
      
      return true;
    });
    
    var leftToProcess = existingFiles.length;
    
    if (leftToProcess === 0) {
      async();
    }
    
    existingFiles.forEach(function(file) {
      processFile(file.src[0], file.dest, options, function() {
        if (--leftToProcess === 0) {
          async();
        }
      });
    });
  });
};

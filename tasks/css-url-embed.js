/*
 * grunt-css-url-embed
 * https://github.com/mihhail-lapushkin/grunt-css-url-embed
 *
 * Copyright (c) 2013 Mihhail Lapushkin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var URL_REGEX = /(?:url\(["']?)(.*?)(?:["']?\))/;
  
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');

  grunt.registerMultiTask('cssUrlEmbed', "Embed URL's as base64 strings inside your stylesheets", function() {
    var options = this.options();

    this.files.forEach(function(f) {
      var inputFile = f.src.filter(function(filepath) {
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found');
          return false;
        } else {
          return true;
        }
      });

      var outputContent = inputFile.map(function(f) {
        grunt.log.subhead('Processing source file "' + f + '"');

        return embedUrls(f, options);
      }).join('');

      grunt.file.write(f.dest, outputContent);
      grunt.log.writeln('File "' + f.dest + '" created');
    });
  });

  function embedUrls(f, options) {
    try {
      var source = grunt.file.read(f);
      var baseDir = path.resolve(options.baseDir ? options.baseDir : path.dirname(f));
      var allUrls = source.match(new RegExp(URL_REGEX.source, 'g')) || [];
      var targetUrls = allUrls.filter(function(url) { return !url.match('(data:|http[s]*:)'); });
      var uniqTargetUrls = grunt.util._.uniq(targetUrls);
      var extractedUrls = uniqTargetUrls.map(function(url) { return url.match(URL_REGEX)[1]; });

      if (targetUrls.length === 0) {
        grunt.log.writeln("Nothing to embed here!");
        return source;
      }

      if (grunt.option('verbose')) {
        grunt.log.writeln('Using "' + baseDir + '" as base directory for URL\'s');
      }

      grunt.log.writeln(uniqTargetUrls.length + " embeddable URL" + (uniqTargetUrls.length > 1 ? "'s" : "") + " found");

      extractedUrls.forEach(function(rawUrl, i) {
       	if (grunt.option('verbose')) {
          grunt.log.writeln('\n[ #' + (i + 1) + ' ]');
        }
      
      	var url = rawUrl;
      
      	if (rawUrl.indexOf('?') >= 0) {
      		url = rawUrl.split('?')[0];
      		
        	if (grunt.option('verbose')) {
          	grunt.log.writeln('"' + rawUrl + '" trimmed to "' + url + '"');
        	}
      	}
      
        var urlFullPath = path.resolve(baseDir + '/' + url);

        if (grunt.option('verbose')) {
          grunt.log.writeln('"' + url + '" resolved to "' + urlFullPath + '"');
        }

        if (!grunt.file.exists(urlFullPath)) {
          grunt.log.warn('"' + (grunt.option('verbose') ? urlFullPath : url) + '" not found on disk');
          return;
        }

        var base64Content = fs.readFileSync(urlFullPath, 'base64');
        var mimeType = mime.lookup(urlFullPath);
        var dataUri = 'data:' + mimeType + ';base64,' + base64Content;
        var escapedRawUrl = rawUrl.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        
        source = source.replace(new RegExp(escapedRawUrl, 'g'), dataUri);
        
        grunt.log.ok('"' + rawUrl + '" embedded');
      });

      return source;
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('URL embed failed!');
    }
  }
};
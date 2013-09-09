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

  var path = require('path');
  var datauri = require('datauri');

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

  var embedUrls = function(f, options) {
    try {
      var source = grunt.file.read(f);
      var baseDir = path.resolve(options.baseDir ? options.baseDir : path.dirname(f));
      var allUrls = source.match(new RegExp(URL_REGEX.source, 'g')) || [];
      var targetUrls = allUrls.filter(function(url) { return !url.match('(data:|http)'); });
      var uniqTargetUrls = grunt.util._.uniq(targetUrls);
      var extractedUrls = uniqTargetUrls.map(function(url) { return url.match(URL_REGEX)[1]; });

      if (targetUrls.length === 0) {
        grunt.log.writeln("Nothing to embed here!");
        return source;
      }

      grunt.log.debug('Using "' + baseDir + '" as base directory for URL\'s');

      grunt.log.writeln(uniqTargetUrls.length + " embeddable URL" + (uniqTargetUrls.length > 1 ? "'s" : "") + " found");

      extractedUrls.forEach(function(url) {
        var urlFullPath = path.resolve(baseDir + '/' + url);
        var dataUri;
        
        grunt.log.debug('"' + url + '" resolved to "' + urlFullPath + '"');

        if (!grunt.file.exists(urlFullPath)) {
          grunt.log.warn('"' + url + '" seems to be wrong');
          return;
        }

        dataUri = datauri(urlFullPath);

        grunt.log.ok('"' + url + '" embedded');

        source = source.replace(new RegExp(url, 'g'), dataUri);
      });

      return source;
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('URL embed failed!');
    }
  };
};
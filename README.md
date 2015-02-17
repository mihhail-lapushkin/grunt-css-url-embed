# grunt-css-url-embed

![](https://badge.fury.io/js/grunt-css-url-embed.svg)&nbsp;&nbsp;
![](https://david-dm.org/mihhail-lapushkin/grunt-css-url-embed.png)

> Embed URLs as base64 data URIs inside your stylesheets

There are lots of base64 embedding Grunt plugins out there, but pretty much all of them are already outdated and/or abandoned. This plugin aims to change that.


## Getting Started
This plugin requires Grunt `~0.4.0` and Python `2.7`, since it depends on [node-gyp](https://github.com/TooTallNate/node-gyp/#installation).

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-css-url-embed --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-css-url-embed');
```

## cssUrlEmbed task
Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Both image and font URLs are supported. Remote(http/https) URLs are supported as well.

### Options

#### baseDir

Type: `String`

Default: `.` or the directory of `Gruntfile.js`

The base directory for URLs. Can be absolute or relative to the directory of your `Gruntfile.js`.

#### failOnMissingUrl

Type: `Boolean`

Default: `true`

Will the script terminate if the file referenced by the URL is missing or the request to get it failed?

When set to `false` a warning will be produced for each missing file or failed request.

#### skipUrlsLargerThan

Type: `String`

Default: No restrictions

Skip URLs that are larger than the specified value.

For example: `'5 MB'`, `'30 KB'`, `'300 B'`.

#### inclusive

Type: `Boolean`

Default: `false`

Specifies the mode of embedding.
* `true` (inclusive) means that you have to manually mark each URL that needs to be embedded using the `/* embed */` comment.
* `false` (exclusive) means that every URL is embedded, except those that are marked with `/* noembed */` comment.

### Usage Examples

#### Map input and output files directly

```js
cssUrlEmbed: {
  encodeDirectly: {
    files: {
      'path/to/output.css': ['path/to/input.css']
    }
  }
}
```

#### Specify base directory if needed
```js
cssUrlEmbed: {
  encodeWithBaseDir: {
    options: {
      baseDir: './app'
    },
    files: {
      'path/to/output.css': ['path/to/input.css']
    }
  }
}
```

#### Process all CSS files in target directory
```js
cssUrlEmbed: {
  encode: {
    expand: true,
    cwd: 'target/css',
    src: [ '**/*.css' ],
    dest: 'target/css'
  }
}
```

#### Exclude URLs by size
```js
cssUrlEmbed: {
  encode: {
    options: {
      skipUrlsLargerThan: '5 MB'
    },
  
    expand: true,
    cwd: 'target/css',
    src: [ '**/*.css' ],
    dest: 'target/css'
  }
}
```

#### Excluding URLs manually (when `inclusive: false`)
```css
.exclude-me {
  background-image: url('exclude_me.png'); /* noembed */
}
```

#### Including URLs manually (when `inclusive: true`)
```css
.include-me {
  background-image: url('include_me.png'); /* embed */
}
```

#### When URLs are in the middle of CSS property
```css
.include-me1 {
  background: transparent url('include_me.png') /* embed */ center center no-repeat;
}

.include-me2 {
  background-image: -webkit-image-set(url('include_me1.png') /* embed */ 1x, url('include_me2.png') /* embed */ 2x);
}
```

## Release History
 * **1.5.1** / 2015-02-17
   * Fixed an issue that caused a file without embeddable URLs not to be written to destination folder.
   * Updated docs to clarify [#21](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/21).
 * **1.5.0** / 2015-02-12
   * Added `inclusive` option. See docs.
 * **1.4.0** / 2014-12-27
   * Merged [#17](https://github.com/mihhail-lapushkin/grunt-css-url-embed/pull/19).
   * Updated dependencies.
 * **1.3.1** / 2014-11-22
   * Merged [#17](https://github.com/mihhail-lapushkin/grunt-css-url-embed/pull/17).
 * **1.3.0** / 2014-11-21
   * Implemented [#16](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/16).
 * **1.2.0** / 2014-11-14
   * Merged [#14](https://github.com/mihhail-lapushkin/grunt-css-url-embed/pull/14).
   * Updated dependencies.
 * **1.1.0** / 2014-10-01
   * Implemented [#12](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/12).
   * Switched to MIME-type sniffing instead of just checking the extension of the file.
 * **1.0.4** / 2014-09-26
   * Implemented [#11](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/11).
   * Merged [#10](https://github.com/mihhail-lapushkin/grunt-css-url-embed/pull/10).
 * **1.0.3** / 2014-09-05
   * Fixed [#8](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/8).
 * **1.0.2** / 2014-09-03
   * Fixed [#7](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/7).
   * Project cleanup.
 * **1.0.1** / 2014-08-23
   * Fixed [#6](https://github.com/mihhail-lapushkin/grunt-css-url-embed/issues/6).
 * **1.0.0** / 2014-07-23
   * The build will now fail if the file referenced by the URL is missing. Set `failOnMissingUrl` to `false` to disable this.
   * Replaced excluding by file extension with excluding through a comment in the CSS file.
 * **0.1.4** / 2014-05-14
   * Added an option to exclude certain file extensions.
 * **0.1.3** / 2014-01-29
   * Fixed handling of URL's with parameters.
   * Improved logging.
 * **0.1.2** / 2013-10-02
   * Changed logging a bit.
 * **0.1.1** / 2013-09-17
   * Removed dependency on [datauri](https://github.com/heldr/datauri).
   * Now pretty much all MIME-types are supported.
 * **0.1.0** / 2013-09-09
   * First version.

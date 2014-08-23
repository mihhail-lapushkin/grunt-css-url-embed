# grunt-css-url-embed

![](https://badge.fury.io/js/grunt-css-url-embed.svg)&nbsp;&nbsp;
![](https://david-dm.org/mihhail-lapushkin/grunt-css-url-embed.png)

> Embed URL's as base64 data URI's inside your stylesheets

There are lots of base64 embedding Grunt plugins out there, but pretty much all of them are already outdated and/or abandoned. This plugin aims to change that.

Most of the codebase is donated from [datauri](https://github.com/ahomu/grunt-data-uri) plugin.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-css-url-embed --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-css-url-embed');
```

## cssUrlEmbed task
_Run this task with the `grunt cssUrlEmbed` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Both image and font URL's are supported. Web URL's are not supported. If you really need them, write a feature request.

### Options

#### baseDir

Type: `String`

Default: `.` or the directory of `Gruntfile.js`

The base directory for URL's. Can be absolute or relative to the directory of your `Gruntfile.js`.

#### failOnMissingUrl

Type: `Boolean`

Default: `true`

Will the script terminate if the file referenced by the URL is missing?

When set to `false` a warning will be produced for each missing file.

### Excluding URL's

You can mark certain URL's to be skipped by this task using the `/* noembed */` comment.

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

#### Excluding URL's
```css
.exclude-me {
  background-image: url('exclude_me.png'); /* noembed */
}
```

## Release History
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
   * Now pretty much all MIME types are supported.
 * **0.1.0** / 2013-09-09
   * First version.

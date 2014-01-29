# grunt-css-url-embed

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

Both image and font URL's are supported. Web URL's won't be supported.

### Options

#### baseDir

Type: `String`

Default: `.` or the directory of `Gruntfile.js`

The base directory for URL's. Can be absolute or relative to the directory of your `Gruntfile.js`.

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


## Release History

 * 2014-01-29&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v0.1.3&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fixed handling of URL's with parameters. Improved logging.
 * 2013-10-02&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v0.1.2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Changed logging a bit.
 * 2013-09-17&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v0.1.1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Removed dependency on [datauri](https://github.com/heldr/datauri). Now pretty much all MIME types are supported.
 * 2013-09-09&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;v0.1.0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;First version.

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      jspm_build: '/usr/local/bin/jspm bundle-sfx --minify src/blocks-loader dist/blocks-loader.min.js'
    },
    cssmin: {
      minify: {
        src: [
          'css/blocks-viewer.css'
        ],
        dest: 'dist/blocks-viewer.min.css'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        browser: false,
        globals: {
          jQuery: true
        }
      },
      all: [
        'Gruntfile.js',
        'src/blocks-component.js',
        'src/blocks-config.js',
        'src/blocks-loader.js',
        'src/blocks-page.js'
      ],
      gruntfile: 'Gruntfile.js'
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['exec']);
  grunt.registerTask('css', ['cssmin']);
};
module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    exec: {
      jspm_build: '/usr/local/bin/jspm bundle-sfx src/esb dist/esb.js'
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
        esnext: true,
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
    },
    jasmine: {
      src: ['dist/esb.js'],
      options: {
        keepRunner: true,
        specs: 'spec/**/*Spec.js'
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['jshint', 'exec']);
  grunt.registerTask('css', ['cssmin']);
  grunt.registerTask('test', ['build', 'jasmine']);
};
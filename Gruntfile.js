module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      loader: {
        src: 'js/jquery.8SblocksLoader.js',
        dest: 'dist/jquery.8SblocksLoader-<%= pkg.blocksVersion.loader %>.min.js'
      },
      viewer: {
        src: 'js/jquery.8SblocksViewer.js',
        dest: 'dist/jquery.8SblocksViewer-<%= pkg.blocksVersion.viewer %>.min.js'
      },
      underscore: {
        src: 'bower_components/underscore/underscore.js',
        dest: 'js/libs/underscore/underscore.min.js'
      }
    },
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.blocksVersion.blocks %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      loader: {
        src: [
          'bower_components/jquery-modern/dist/jquery.min.js',
          'js/libs/underscore/underscore.min.js',
          'bower_components/handlebars/handlebars.min.js',
          'bower_components/javascript-debug/ba-debug.min.js',
          'dist/jquery.8SblocksLoader-<%= pkg.blocksVersion.loader %>.min.js'
        ],
        dest: 'dist/blocks-loader-<%= pkg.blocksVersion.loader %>.min.js'
      },
      loader_legacy: {
        src: [
          'bower_components/jquery-legacy/dist/jquery.min.js',
          'js/libs/underscore/underscore.min.js',
          'bower_components/handlebars/handlebars.min.js',
          'bower_components/javascript-debug/ba-debug.min.js',
          'dist/jquery.8SblocksLoader-<%= pkg.blocksVersion.loader %>.min.js'
        ],
        dest: 'dist/blocks-loader-legacy-<%= pkg.blocksVersion.loader %>.min.js'
      },
      viewer: {
        src: [
          'bower_components/jquery-modern/dist/jquery.min.js',
          'js/libs/jquery/jquery-ui.min.js',
          'js/libs/underscore/underscore.min.js',
          'bower_components/javascript-debug/ba-debug.min.js',
          'dist/jquery.8SblocksViewer-<%= pkg.blocksVersion.viewer %>.min.js'
        ],
        dest: 'dist/blocks-viewer-<%= pkg.blocksVersion.viewer %>.min.js'
      },
      all: {
        src: [
          'bower_components/jquery-modern/dist/jquery.min.js',
          'js/libs/jquery/jquery-ui.min.js',
          'js/libs/underscore/underscore.min.js',
          'bower_components/handlebars/handlebars.min.js',
          'bower_components/javascript-debug/ba-debug.min.js',
          'dist/jquery.8SblocksLoader-<%= pkg.blocksVersion.loader %>.min.js',
          'dist/jquery.8SblocksViewer-<%= pkg.blocksVersion.viewer %>.min.js'
        ],
        dest: 'dist/blocks-<%= pkg.blocksVersion.blocks %>.min.js'
      },
      debug: {
        src: [
          'bower_components/jquery-modern/dist/jquery.min.js',
          'js/libs/underscore/underscore.min.js',
          'bower_components/handlebars/handlebars.min.js',
          'bower_components/javascript-debug/ba-debug.min.js',
          'js/jquery.8SblocksLoader.js'
        ],
        dest: 'dist/blocks-debug.js'
      },
    },
    cssmin: {
      minify: {
        src: [
          'css/blocks-viewer.css'
        ],
        dest: 'dist/blocks-viewer-<%= pkg.blocksVersion.viewer %>.min.css'
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
        'js/jquery.8SblocksLoader.js',
        'js/jquery.8SblocksViewer.js'
      ],
      gruntfile: 'Gruntfile.js'
    }
  });

  grunt.registerTask('default', ['jshint', 'uglify:underscore', 'uglify:loader', 'uglify:viewer', 'concat:loader', 'concat:viewer', 'concat:loader_legacy', 'concat:all', 'cssmin']);
  grunt.registerTask('loader', ['uglify:underscore', 'uglify:loader', 'concat:loader']);
  grunt.registerTask('loader-legacy', ['uglify:underscore', 'uglify:loader', 'concat:loader_legacy']);
  grunt.registerTask('viewer', ['uglify:underscore', 'uglify:viewer', 'concat:viewer']);
  grunt.registerTask('css', ['cssmin']);
  grunt.registerTask('debug', ['uglify:underscore', 'concat:debug']);
};
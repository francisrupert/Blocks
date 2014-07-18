module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

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
      handlebars: {
        src: 'js/libs/handlebars/handlebars.js',
        dest: 'dist/handlebars.min.js'
      }
    },
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.blocksVersion.blocks %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      loader: {
        src: [
          'js/libs/jquery/jquery.min.js',
          'js/libs/underscore/underscore.min.js',
          'js/libs/handlebars/handlebars.min.js',
          'dist/jquery.8SblocksLoader-<%= pkg.blocksVersion.loader %>.min.js'
        ],
        dest: 'dist/blocks-loader-<%= pkg.blocksVersion.loader %>.min.js'
      },
      viewer: {
        src: [
          'js/libs/jquery/jquery.min.js',
          'js/libs/jquery/jquery-ui.min.js',
          'js/libs/underscore/underscore.min.js',
          'dist/jquery.8SblocksViewer-<%= pkg.blocksVersion.viewer %>.min.js'
        ],
        dest: 'dist/blocks-viewer-<%= pkg.blocksVersion.viewer %>.min.js'
      },
      all: {
        src: [
          'js/libs/jquery/jquery.min.js',
          'js/libs/jquery/jquery-ui.min.js',
          'js/libs/underscore/underscore.min.js',
          'js/libs/handlebars/handlebars.min.js',
          'dist/jquery.8SblocksLoader-<%= pkg.blocksVersion.loader %>.min.js',
          'dist/jquery.8SblocksViewer-<%= pkg.blocksVersion.viewer %>.min.js'
        ],
        dest: 'dist/blocks-<%= pkg.blocksVersion.blocks %>.min.js'
      },
      debug: {
        src: [
          'js/libs/jquery/jquery.min.js',
          'js/libs/underscore/underscore.min.js',
          'js/libs/handlebars/handlebars.min.js',
          'js/jquery.8SblocksLoader.js'
        ],
        dest: 'dist/blocks-loader-debug.js'
      }
    },
    cssmin: {
      minify: {
        src: [
          'css/blocks-viewer.css'
        ],
        dest: 'dist/blocks-viewer-<%= pkg.blocksVersion.viewer %>.min.css'
      }
    }
  });

  grunt.registerTask('default', ['uglify:loader', 'uglify:viewer', 'concat:loader', 'concat:viewer', 'concat:all', 'cssmin']);
  grunt.registerTask('loader', ['uglify:loader', 'concat:loader']);
  grunt.registerTask('viewer', ['uglify:viewer', 'concat:viewer']);
  grunt.registerTask('css', ['cssmin']);
  grunt.registerTask('debug', ['concat:debug']);
};
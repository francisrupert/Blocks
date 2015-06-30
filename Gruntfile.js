module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    sass: {
      dist: {
        options: {
          sourceMap: true
        },
        files: [
          {
            expand: true,
            cwd: 'sass/',
            src: '*.scss',
            dest: 'css/',
            ext: '.css'
          }
        ]
      }
    },
    autoprefixer: {
      options: {
        map: true, // Use and update the sourcemap
        browsers: ["last 2 versions"]
      },
      project_css: {
        expand: true,
        flatten: true,
        src: 'css/*.css',
        dest: 'css/'
      }
    },
    exec: {
      jspm_build: 'node_modules/.bin/jspm bundle-sfx --minify src/esb dist/esb.min.js'
    },
    cssmin: {
      minify: {
        src: [
          'css/esb.css'
        ],
        dest: 'dist/esb.min.css'
      }
    },
    browserSync: {
      dev: {
        files: {
          src : [
            '*.html',
            'wiki-examples/**/*.html',
            'css/**/*.css',
            'src/**/*.js'
          ]
        },
        options: {
          startPath: 'dev.html',
          watchTask: true,
          server: './'
        }
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
    watch: {
      styles: {
        files: [
          'sass/*.scss',
          'sass/*/*.scss'
        ],
        tasks: ['sass', 'autoprefixer']
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      },
      continuous: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS', 'Chrome', 'Firefox'],
        // browsers: ['Firefox'],
        singleRun: true
      }
    }
  });

  grunt.registerTask('dev', ['browserSync', 'watch']);
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('test', ['karma']);
  grunt.registerTask('css', ['sass', 'cssmin']);
  grunt.registerTask('build', ['jshint', 'exec', 'css']);
};
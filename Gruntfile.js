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
          },
          {
            expand: true,
            cwd: 'wiki-examples/components/scss/',
            src: '*.scss',
            dest: 'wiki-examples/components/css/',
            ext: '.css'
          }
        ]
      },
      bootstrap_demo_project: {
        options: {
          sourceMap: true,
          includePaths: ['site/bower_components/bootstrap-sass/assets/stylesheets']
        },
        files: [
          {
            expand: true,
            cwd: 'site/demo_projects/bootstrap/scss/',
            src: '*.scss',
            dest: 'site/demo_projects/bootstrap/css/',
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
      },
      examples_css: {
        expand: true,
        flatten: true,
        src: 'wiki-examples/components/css/*.css',
        dest: 'wiki-examples/components/css/'
      },
      bootstrap_demo_project: {
        expand: true,
        flatten: true,
        src: 'site/demo_projects/bootstrap/css/*.css',
        dest: 'site/demo_projects/bootstrap/css/'
      }
    },
    exec: {
      jspm_build: 'node_modules/.bin/jspm bundle-sfx --minify src/esb dist/esb.min.js && node_modules/.bin/jspm bundle-sfx src/esb dist/esb.js'
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
            'wiki-examples/components/css/**/*.css',
            'src/**/*.js',
            'site/demo_projects/**/*.html',
            'site/demo_projects/**/*.css',
            'site/demo_projects/**/*.js'
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
          'sass/*/*.scss',
          'wiki-examples/components/scss/*.scss'
        ],
        tasks: ['sass:dist', 'autoprefixer:project_css', 'autoprefixer:examples_css']
      },
      bootstrap_demo_project_styles: {
        files: [
          'site/demo_projects/bootstrap/scss/*/*.scss',
          'site/demo_projects/bootstrap/scss/*.scss'
        ],
        tasks: ['sass:bootstrap_demo_project', 'autoprefixer:bootstrap_demo_project']
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      },
      continuous: {
        configFile: 'karma.conf.js',
        browsers: ['Chrome'],
        // browsers: ['Chrome', 'Firefox'],
        // browsers: ['PhantomJS'],
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
// Karma configuration
// Generated on Tue May 05 2015 13:45:05 GMT-0500 (CDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jspm', 'jasmine-jquery', 'jasmine'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        "src/**/*.js": ['jshint']
    },

    jshintPreprocessor: {
        jshintrc: '.jshintrc'
    },

    // list of files / patterns to load in the browser
    files: [
        {pattern: 'spec/fixtures/*', watched: true, included: false, served: true}
    ],

    jspm: {
        loadFiles: ['src/esb-config.js', 'src/esb-page.js', 'src/esb-util.js', 'src/esb-component.js', 'src/esb-page-viewer.js', 'spec/**/*.js']
        // serveFiles: ['spec/_esb-test-config.json']
    },


    // list of files to exclude
    exclude: [
    ],




    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'osx'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};

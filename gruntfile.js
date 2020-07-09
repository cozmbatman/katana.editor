module.exports = function(grunt) {
  require('load-grunt-config')(grunt, {
    // Pass data to tasks
    init: true,
    data: {
      pkg: grunt.file.readJSON('package.json'),
      scssSrc : [
        './src/scss/*.scss',
        './src/scss/core/*.scss',
        './src/scss/partials/*.scss',
        './src/scss/pages/*.scss'
      ],
      katana: {
        src: [
          './src/js/*.js',      
          './src/js/content/*.js',
          './src/js/models/*.js',
          './src/js/notes/*.js',
          './src/js/toolbars/*.js'
        ],
        dest: './build/js/katana.js'
      },
    }
  });
};
// Takes your SCSS files and compiles them to CSS
const nodeNeat = require('node-neat');
const sass = require('node-sass');

module.exports = {
  options: {
    sourceMap: false,
    implementation: sass,
    outputStyle: 'compressed',
    includePaths: nodeNeat.includePaths
  },
  dev : {
    options: {
      sourceMap: true,
      outputStyle: 'nested',
      includePaths: nodeNeat.includePaths
    },
    files: {
      './public/build/katana.css': './src/scss/app.scss'
    }
  }
};

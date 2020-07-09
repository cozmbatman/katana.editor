module.exports = function (grunt, options) {
  //var editorFiles = options.katana.src.concat(options.mizuchi.src);
  return {
    options: {
      livereloadOnError: false,
      spawn:false
    },
    katana : {
      files: options.katana.src,
      tasks: ['concat:katana']
    },
    style: {
      files: options.scssSrc,
      tasks: ['sass:dev']
    }
  }
  
};

module.exports = function (grunt, options ) {
  return {
    katana: {
      src: options.katana.src,
      dest: options.katana.dest
    }
  };
};
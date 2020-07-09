module.exports = {
  options: {
    logConcurrentOutput: true
  },
  style: {
    tasks: ["watch:style"]
  },
  dev: {
    tasks: ["watch:katana", "watch:style"]
  },
  katana: {
    tasks: ["watch:katana"]
  }
}
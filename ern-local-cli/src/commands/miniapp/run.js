exports.command = 'run <command>'
exports.desc = 'Commands to run the miniapp'
exports.builder = function (yargs) {
  return yargs.commandDir('run')
}
exports.handler = function (argv) {}

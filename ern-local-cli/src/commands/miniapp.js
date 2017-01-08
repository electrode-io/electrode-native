exports.command = 'miniapp <command>'
exports.desc = 'Commands to be executed from a miniapp root folder'
exports.builder = function (yargs) {
  return yargs.commandDir('miniapp')
}
exports.handler = function (argv) {}

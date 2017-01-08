exports.command = 'del <command>'
exports.desc = 'Remove stuff from the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('del')
}
exports.handler = function (argv) {}

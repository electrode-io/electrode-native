exports.command = 'del <command>'
exports.desc = 'Remove stuff from the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('del').demandCommand(1, 'add needs a command');
}
exports.handler = function (argv) {}

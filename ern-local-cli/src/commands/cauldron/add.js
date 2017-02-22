exports.command = 'add <command>'
exports.desc = 'Add stuff to the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('add').demandCommand(1, 'add needs a command');
}
exports.handler = function (argv) {}

exports.command = 'add <command>'
exports.desc = 'Add stuff to the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('add')
}
exports.handler = function (argv) {}

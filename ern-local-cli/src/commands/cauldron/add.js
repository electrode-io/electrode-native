exports.command = 'add <command>'
exports.desc = 'Add stuff to the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('add').strict()
}
exports.handler = function (argv) {}

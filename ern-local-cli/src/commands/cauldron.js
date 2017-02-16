exports.command = 'cauldron <command>'
exports.desc = 'Cauldron service access commands'
exports.builder = function (yargs) {
  return yargs.commandDir('cauldron').strict()
}
exports.handler = function (argv) {}

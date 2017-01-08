exports.command = 'cauldron <command>'
exports.desc = 'Cauldron service access commands'
exports.builder = function (yargs) {
  return yargs.commandDir('cauldron');
}
exports.handler = function (argv) {}

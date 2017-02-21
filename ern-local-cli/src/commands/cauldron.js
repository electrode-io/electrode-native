exports.command = 'cauldron <command>'
exports.desc = 'Cauldron service access commands'
exports.builder = function (yargs) {
  return yargs.commandDir('cauldron').demandCommand(1, 'cauldron needs a command');
}
exports.handler = function (argv) {};

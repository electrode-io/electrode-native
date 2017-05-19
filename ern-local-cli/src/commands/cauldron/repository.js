exports.command = 'repository'
exports.desc = 'Manage Cauldron git repository(ies)'
exports.builder = function (yargs) {
  return yargs.commandDir('repository').demandCommand(1, 'repository needs a command')
}
exports.handler = function (argv) {}

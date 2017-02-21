exports.command = 'get <command>'
exports.desc = 'Get stuff from the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('get').demandCommand(1, 'add needs a command');
}
exports.handler = function (argv) {}

exports.command = 'get'
exports.desc = 'Get objects from the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('get').demandCommand(1, 'add needs a command')
}
exports.handler = function (argv) {}

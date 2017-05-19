exports.command = 'api'
exports.desc = 'Commands to generate APIs'
exports.builder = function (yargs) {
  return yargs.commandDir('api').demandCommand(1, 'Need a command')
}

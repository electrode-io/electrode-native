exports.command = 'get <command>'
exports.desc = 'Get stuff from the Cauldron'
exports.builder = function (yargs) {
  return yargs.commandDir('get').strict()
}
exports.handler = function (argv) {}

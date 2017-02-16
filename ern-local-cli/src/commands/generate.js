exports.command = 'generate <command>'
exports.desc = 'Commands to trigger various platform generators'
exports.builder = function (yargs) {
  return yargs.commandDir('generate').strict()
}
exports.handler = function (argv) {}

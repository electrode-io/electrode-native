exports.command = 'platform <command>'
exports.desc = 'Platform related commands'
exports.builder = function (yargs) {
  return yargs.commandDir('platform').strict()
}
exports.handler = function (argv) {}

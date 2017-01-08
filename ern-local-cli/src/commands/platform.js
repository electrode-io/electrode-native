exports.command = 'platform <command>'
exports.desc = 'Platform related commands'
exports.builder = function (yargs) {
  return yargs.commandDir('platform')
}
exports.handler = function (argv) {}

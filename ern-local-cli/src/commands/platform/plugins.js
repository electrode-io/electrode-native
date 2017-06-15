// @flow

exports.command = 'plugins'
exports.desc = 'Plugins access commands'
exports.builder = function (yargs: any) {
  return yargs.commandDir('plugins').demandCommand(1, 'plugins needs a command')
}
exports.handler = function (argv: any) {}

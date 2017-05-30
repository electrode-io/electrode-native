// @flow

exports.command = 'compat'
exports.desc = 'Commands related to binary compatibility checking of the miniapp'
exports.builder = function (yargs: any) {
  return yargs.commandDir('compat').demandCommand(1, 'compat needs a command')
}
exports.handler = function (argv: any) {}

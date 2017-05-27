// @flow

exports.command = 'generate'
exports.desc = 'Commands to access platform generators'
exports.builder = function (yargs: any) {
  return yargs.commandDir('generate').demandCommand(1, `generate needs a command`)
}
exports.handler = function (argv: any) {}

// @flow

exports.command = 'create'
exports.desc = 'Commands to access platform creators'
exports.builder = function (yargs: any) {
  return yargs.commandDir('create').demandCommand(1, `create needs a command`)
}
exports.handler = function (argv: any) {}

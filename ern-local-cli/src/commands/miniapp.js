// @flow

exports.command = 'miniapp'
exports.desc = 'Commands to create and work with MiniApps'
exports.builder = function (yargs: any) {
  return yargs.commandDir('miniapp').demandCommand(1, 'needs a command')
}

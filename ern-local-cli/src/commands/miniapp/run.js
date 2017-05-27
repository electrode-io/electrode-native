// @flow

exports.command = 'run'
exports.desc = 'Commands to run a miniapp standalone'
exports.builder = function (yargs: any) {
  return yargs.commandDir('run').demandCommand(1, 'run needs a command')
}
exports.handler = function (argv: any) {}

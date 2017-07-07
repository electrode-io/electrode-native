// @flow

exports.command = 'run'
exports.desc = 'Command to run the miniapps'
exports.builder = function (yargs: any) {
  return yargs.commandDir('run').demandCommand(1, `run needs a command to start`)
}
exports.handler = function (argv: any) {}

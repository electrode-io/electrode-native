// @flow

exports.command = 'binarystore'
exports.desc = 'Binary store access commands'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('binarystore')
    .demandCommand(1, 'binarystore needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

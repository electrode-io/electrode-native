// @flow

exports.command = 'platform'
exports.desc = 'Platform related commands'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('platform')
    .demandCommand(1, 'platform needs a command')
    .strict()
}

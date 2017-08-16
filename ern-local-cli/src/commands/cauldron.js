// @flow

exports.command = 'cauldron'
exports.desc = 'Cauldron access commands'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('cauldron')
    .demandCommand(1, 'cauldron needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

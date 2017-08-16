// @flow

exports.command = 'get'
exports.desc = 'Get objects from the Cauldron'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('get')
    .demandCommand(1, 'add needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

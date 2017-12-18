// @flow

exports.command = 'list'
exports.desc = 'List information associated to an Electrode Native module'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('list')
    .demandCommand(1, 'list needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

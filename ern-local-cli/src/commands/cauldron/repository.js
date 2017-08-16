// @flow

exports.command = 'repository'
exports.desc = 'Manage Cauldron git repository(ies)'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('repository')
    .demandCommand(1, 'repository needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

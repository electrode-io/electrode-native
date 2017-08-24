// @flow

exports.command = 'repo'
exports.desc = 'Manage Cauldron git repository(ies)'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('repo')
    .demandCommand(1, 'repo needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

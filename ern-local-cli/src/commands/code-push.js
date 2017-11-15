// @flow

exports.command = 'code-push'
exports.desc = 'code-push commands'
exports.builder = function (yargs: any) {
  return yargs
    .commandDir('code-push')
    .demandCommand(1, 'code-push needs a command')
    .strict()
}
exports.handler = function (argv: any) {}

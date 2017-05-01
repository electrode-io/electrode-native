exports.command = 'generate'
exports.desc = 'Commands to access platform generators'
exports.builder = function (yargs) {
  return yargs.commandDir('generate').demandCommand(1, `generate needs a command`);
}
exports.handler = function (argv) {}

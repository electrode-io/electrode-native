exports.command = 'generate <command>'
exports.desc = 'Commands to trigger various platform generators'
exports.builder = function (yargs) {
  return yargs.commandDir('generate').demandCommand(1, `generate needs a command`);
}
exports.handler = function (argv) {}

exports.command = 'run <command>'
exports.desc = 'Commands to run the miniapp'
exports.builder = function (yargs) {
  return yargs.commandDir('run').demandCommand(1, 'run needs a command');
}
exports.handler = function (argv) {};

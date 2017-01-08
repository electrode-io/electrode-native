exports.command = 'plugins <command>'
exports.desc = 'Commands to manage plugins in a miniapp'
exports.builder = function (yargs) {
  return yargs.commandDir('plugins')
}
exports.handler = function (argv) {}

import MiniApp from '../../util/miniapp.js';

exports.command = 'add <name> [dev]'
exports.desc = 'Add a dependency to this miniapp'

exports.builder = function(yargs) {
  return yargs
    .option('dev', {
      type: 'bool',
      alias: 'd',
      describe: 'Add this dependency as a devDependency'
    })
}

exports.handler = async function (argv) {
  await MiniApp.fromCurrentPath().addDependency(
    argv.name, { dev : argv.dev });
}

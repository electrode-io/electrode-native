// @flow

import MiniApp from '../../lib/miniapp'

exports.command = 'add <name> [dev]'
exports.desc = 'Add a dependency to this miniapp'

exports.builder = function (yargs: any) {
  return yargs
        .option('dev', {
          type: 'bool',
          alias: 'd',
          describe: 'Add this dependency as a devDependency'
        }).demandCommand(1, 'Needs a name')
}

exports.handler = async function (argv: any) {
  return MiniApp.fromCurrentPath().addDependency(
        argv.name, {dev: argv.dev})
}

// @flow

import MiniApp from '../lib/miniapp'

exports.command = 'add <name> [dev]'
exports.desc = 'Add a dependency to this miniapp'

exports.builder = function (yargs: any) {
  return yargs
    .option('dev', {
      type: 'bool',
      alias: 'd',
      describe: 'Add this dependency as a devDependency'
    })
}

exports.handler = function ({
  name,
  dev = false
} : {
  name: string,
  dev: boolean
}) {
  try {
    return MiniApp.fromCurrentPath().addDependency(name, {dev})
  } catch (e) {
    log.error(`${e}`)
  }
}

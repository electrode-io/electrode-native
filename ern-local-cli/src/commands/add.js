// @flow

import {
  MiniApp
} from '@walmart/ern-core'
import {
  Dependency
} from '@walmart/ern-util'

exports.command = 'add <dependency> [dev]'
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
  dependency,
  dev = false
} : {
  dependency: string,
  dev: boolean
}) {
  try {
    return MiniApp.fromCurrentPath().addDependency(Dependency.fromString(dependency), {dev})
  } catch (e) {
    log.error(`${e}`)
  }
}

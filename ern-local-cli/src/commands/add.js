// @flow

import {
  MiniApp
} from 'ern-core'
import {
  Dependency
} from 'ern-util'
import utils from '../lib/utils'

// Note : We use `pkg` instead of `package` because `package` is
// a reserved JavaScript word
exports.command = 'add <packages..>'
exports.desc = 'Add one or more package(s) to this miniapp'

exports.builder = function (yargs: any) {
  return yargs
    .option('dev', {
      type: 'bool',
      alias: 'd',
      describe: 'Add this/these packages to devDependencies'
    })
    .option('peer', {
      type: 'bool',
      alias: 'p',
      describe: 'Add this/these packages to peerDependencies'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  packages,
  dev = false,
  peer = false
} : {
  packages: Array<string>,
  dev: boolean,
  peer: boolean
}) {
  try {
    for (const pkg of packages) {
      log.debug(`Adding package: ${pkg}`)
      await MiniApp.fromCurrentPath().addDependency(Dependency.fromString(pkg), {dev, peer})
    }
  } catch (e) {
    log.error(`${e}`)
  }
}

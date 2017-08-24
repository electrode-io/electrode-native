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
exports.command = 'add <pkg>'
exports.desc = 'Add a package to this miniapp'

exports.builder = function (yargs: any) {
  return yargs
    .option('dev', {
      type: 'bool',
      alias: 'd',
      describe: 'Add this package to devDependencies'
    })
    .option('peer', {
      type: 'bool',
      alias: 'p',
      describe: 'Add this package to peerDependencies'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = function ({
  pkg,
  dev = false,
  peer = false
} : {
  pkg: string,
  dev: boolean,
  peer: boolean
}) {
  try {
    return MiniApp.fromCurrentPath().addDependency(Dependency.fromString(pkg), {dev, peer})
  } catch (e) {
    log.error(`${e}`)
  }
}

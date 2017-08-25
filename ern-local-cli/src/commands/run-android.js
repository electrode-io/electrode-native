// @flow

import {
  MiniApp
} from 'ern-core'
import {
  DependencyPath
} from 'ern-util'
import utils from '../lib/utils'

exports.command = 'run-android [miniapp]'
exports.desc = 'Run a MiniApp in the android Runner application'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function ({
  miniapp
} : {
  miniapp?: string
}) {
  try {
    const miniappObj = miniapp
      ? await MiniApp.fromPackagePath(DependencyPath.fromString(miniapp))
      : MiniApp.fromCurrentPath()
    miniappObj.runInAndroidRunner()
  } catch (e) {
    log.error(`${e}`)
  }
}

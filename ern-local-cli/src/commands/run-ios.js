// @flow

import {
  MiniApp
} from 'ern-core'
import {
  DependencyPath
} from 'ern-util'
import utils from '../lib/utils'

exports.command = 'run-ios [miniapp]'
exports.desc = 'Run a MiniApp in the ios Runner application'

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
    miniappObj.runInIosRunner()
  } catch (e) {
    log.error(`${e}`)
  }
}

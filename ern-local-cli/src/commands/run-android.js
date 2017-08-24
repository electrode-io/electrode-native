// @flow

import {
  MiniApp
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'run-android'
exports.desc = 'Run miniapp in android runner project'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().runInAndroidRunner()
  } catch (e) {
    log.error(`${e}`)
  }
}

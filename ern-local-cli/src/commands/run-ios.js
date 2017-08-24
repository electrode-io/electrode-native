// @flow

import {
  MiniApp
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'run-ios'
exports.desc = 'Run miniapp in ios runner project'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().runInIosRunner()
  } catch (e) {
    log.error(`${e}`)
  }
}

// @flow

import {
  MiniApp
} from 'ern-core'

exports.command = 'run-android'
exports.desc = 'Run miniapp in android runner project'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().runInAndroidRunner()
  } catch (e) {
    log.error(`${e}`)
  }
}

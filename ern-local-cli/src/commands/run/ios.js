// @flow

import {
  MiniApp
} from '@walmart/ern-core'

exports.command = 'ios'
exports.desc = 'Run miniapp in ios runner project'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().runInIosRunner()
  } catch (e) {
    log.error(`${e}`)
  }
}

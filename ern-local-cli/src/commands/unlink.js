// @flow

import {
  MiniApp
} from '@walmart/ern-core'

exports.command = 'unlink'
exports.desc = 'Unlink a MiniApp'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().unlink()
  } catch (e) {
    log.error(`${e}`)
  }
}

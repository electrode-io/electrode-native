// @flow

import {
  MiniApp
} from 'ern-core'

exports.command = 'link'
exports.desc = 'Link a MiniApp'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().link()
  } catch (e) {
    log.error(`${e}`)
  }
}

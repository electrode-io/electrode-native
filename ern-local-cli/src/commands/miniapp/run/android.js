// @flow

import MiniApp from '../../../lib/miniapp'

exports.command = 'android'
exports.desc = 'Run miniapp in android runner project'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  await MiniApp.fromCurrentPath().runInAndroidRunner()
}

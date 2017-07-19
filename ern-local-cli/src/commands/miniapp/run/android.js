// @flow

import {Utils} from '@walmart/ern-util'

exports.command = 'android'
exports.desc = 'Run miniapp in android runner project'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  Utils.logErrorAndExitProcess(`We made this command simple for you, simply run 'ern run-android' from the root folder of your mini-app`)
}

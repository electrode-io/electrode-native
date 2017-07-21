// @flow

import {Utils} from '@walmart/ern-util'

exports.command = 'ios'
exports.desc = 'Run miniapp in ios runner project [DEPRECATED]'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function () {
  Utils.logErrorAndExitProcess(`We made this command simple for you, simply run 'ern run-ios' from the root folder of your mini-app`)
}

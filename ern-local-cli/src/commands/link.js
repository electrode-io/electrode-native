// @flow

import {
  MiniApp,
  utils as coreUtils
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'link'
exports.desc = 'Link a MiniApp'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().link()
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

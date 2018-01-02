// @flow

import {
  MiniApp,
  utils as coreUtils
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'unlink'
exports.desc = 'Unlink a MiniApp'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function () {
  try {
    MiniApp.fromCurrentPath().unlink()
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

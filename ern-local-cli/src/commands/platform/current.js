// @flow

import {
  Platform
} from 'ern-core'
import {
  Utils
} from 'ern-util'
import utils from '../../lib/utils'

exports.command = 'current'
exports.desc = 'Show current platform version'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function () {
  try {
    log.info(`Platform version : v${Platform.currentVersion}`)
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

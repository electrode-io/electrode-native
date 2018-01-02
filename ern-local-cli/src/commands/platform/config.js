// @flow

import {
  config as ernConfig,
  utils as coreUtils
} from 'ern-core'
import utils from '../../lib/utils'

exports.command = 'config <key> [value]'
exports.desc = 'Get or set a configuration key'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  key,
  value
} : {
  key: string,
  value?: string
}) {
  try {
    if (value) {
      let valueToset =
          value === 'true' ? true
        : value === 'false' ? false
        : value

      ernConfig.setValue(key, valueToset)
    } else {
      log.info(`${key}: ${ernConfig.getValue(key)}`)
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

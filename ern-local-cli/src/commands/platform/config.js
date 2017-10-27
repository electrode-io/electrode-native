// @flow

import {
  config as ernConfig
} from 'ern-util'
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
  if (value) {
    ernConfig.setValue(key, value)
  } else {
    log.info(`${key}: ${ernConfig.getValue(key)}`)
  }
}

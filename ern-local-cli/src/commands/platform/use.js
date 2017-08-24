// @flow

import {
  Platform
} from 'ern-core'
import utils from '../../lib/utils'

exports.command = 'use <version>'
exports.desc = 'Switch to a given ern platform version'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  version
} : {
  version: string
}) {
  try {
    Platform.switchToVersion(version.toString().replace('v', ''))
  } catch (e) {
    log.error(e.message)
  }
}

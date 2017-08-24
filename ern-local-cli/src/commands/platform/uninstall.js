// @flow

import {
  Platform
} from 'ern-core'
import utils from '../../lib/utils'

exports.command = 'uninstall <version>'
exports.desc = 'Uninstall a given platform version'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  version
} : {
  version: string
}) {
  try {
    Platform.uninstallPlatform(version.toString().replace('v', ''))
  } catch (e) {
    log.error(e)
  }
}

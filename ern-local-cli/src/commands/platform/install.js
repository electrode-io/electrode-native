// @flow

import {
  Platform
} from 'ern-core'
import {
  Utils
} from 'ern-util'
import utils from '../../lib/utils'

exports.command = 'install <version>'
exports.desc = 'Install a given ern platform version'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  version
} : {
  version: string
}) {
  try {
    Platform.installPlatform(version.toString().replace('v', ''))
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

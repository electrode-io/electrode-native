// @flow

import {
  MiniApp,
  Platform,
  utils as coreUtils
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'upgrade-miniapp'
exports.desc = 'Upgrade a MiniApp to current or specific platform version'

exports.builder = function (yargs: any) {
  return yargs
    .option('version', {
      alias: 'v',
      type: 'string',
      describe: 'Specific platform version to upgrade MiniApp to'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = function ({
  version = Platform.currentVersion,
  force = false
} : {
  version: string,
  force: boolean
}) {
  try {
    const miniApp = MiniApp.fromCurrentPath()
    const versionWithoutPrefix = version.toString().replace('v', '')
    miniApp.upgradeToPlatformVersion(versionWithoutPrefix)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

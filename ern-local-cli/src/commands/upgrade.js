// @flow

import {
  MiniApp
} from '@walmart/ern-core'

exports.command = 'upgrade <platformVersion> [force]'
exports.desc = 'Upgrade the mini app to a specific platform version'

exports.builder = function (yargs: any) {
  return yargs
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force upgrade'
    })
}

exports.handler = function ({
  platformVersion,
  force = false
} : {
  platformVersion: string,
  force: boolean
}) {
  try {
    MiniApp.fromCurrentPath().upgradeToPlatformVersion(
      platformVersion.toString().replace('v', ''), force)
  } catch (e) {
    log.error(`${e}`)
  }
}

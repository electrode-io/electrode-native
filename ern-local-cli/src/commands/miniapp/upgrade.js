// @flow

import MiniApp from '../../lib/miniapp'

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

exports.handler = async function ({
  platformVersion,
  force = false
} : {
  platformVersion: string,
  force: boolean
}) {
  await MiniApp.fromCurrentPath().upgradeToPlatformVersion(
        platformVersion.toString().replace('v', ''), force)
}

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

exports.handler = async function (argv: any) {
  await MiniApp.fromCurrentPath().upgradeToPlatformVersion(
        argv.platformVersion.toString().replace('v', ''), argv.force)
}

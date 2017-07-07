// @flow

import {Utils} from '@walmart/ern-util'

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
  Utils.logErrorAndExitProcess(`We have made it simple for you, simply run 'ern upgrade ${platformVersion}' to upgrade this miniapp to a version ${platformVersion} of platform.`)
}

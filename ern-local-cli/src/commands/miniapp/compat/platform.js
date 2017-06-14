// @flow

import {
  checkCompatibilityWithPlatform
} from '../../../lib/compatibility'

exports.command = 'platform [platformVersion]'
exports.desc = 'Check the compatibility of the miniapp with platform current or specific version'

exports.builder = function (yargs: any) {
  return yargs
        .option('platformVersion', {
          alias: 'v',
          describe: 'Platform version to check compatibility with'
        })
}

exports.handler = function ({
  platformVersion
} : {
  platformVersion: string
}) {
  return checkCompatibilityWithPlatform(platformVersion)
}

// @flow

import {
  Platform
} from 'ern-core'
import {
  tagOneLine,
  Utils
} from 'ern-util'
import chalk from 'chalk'
import utils from '../../lib/utils'
import semver from 'semver'

const BASE_RELEASE_URL = `https://github.com/electrode-io/electrode-native/releases/tag`

exports.command = 'list'
exports.desc = 'List platform versions'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function () {
  try {
    log.info(tagOneLine`
    ${chalk.green('[CURRENT]')}
    ${chalk.yellow('[INSTALLED]')}
    ${chalk.gray('[NOT INSTALLED]')}`)
    for (const version of Platform.versions) {
      // Don't show versions pre 0.7.0 as it was not official public releases
      // Electrode Native initial public release was 0.7.0 so starting from
      // this version
      if (semver.lt(version, '0.7.0')) { continue }
      if (Platform.isPlatformVersionInstalled(version)) {
        if (Platform.currentVersion === version) {
          log.info(chalk.green(`-> v${version}\t\t`) + chalk.white(`${BASE_RELEASE_URL}/v${version}`))
        } else {
          log.info(chalk.yellow(`v${version}\t\t`) + chalk.white(`${BASE_RELEASE_URL}/v${version}`))
        }
      } else {
        log.info(chalk.gray(`v${version}\t\t`) + chalk.white(`${BASE_RELEASE_URL}/v${version}`))
      }
    }
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

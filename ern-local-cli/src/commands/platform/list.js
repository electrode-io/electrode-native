// @flow

import {
  Platform
} from 'ern-core'
import {
  tagOneLine
} from 'ern-util'
import chalk from 'chalk'
import utils from '../../lib/utils'

exports.command = 'list'
exports.desc = 'List platform versions'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function () {
  log.info(tagOneLine`
    ${chalk.green('[CURRENT]')}
    ${chalk.yellow('[INSTALLED]')}
    ${chalk.gray('[NOT INSTALLED]')}`)
  for (const version of Platform.versions) {
    if (Platform.isPlatformVersionInstalled(version)) {
      if (Platform.currentVersion === version) {
        log.info(chalk.green(`-> v${version}`))
      } else {
        log.info(chalk.yellow(`v${version}`))
      }
    } else {
      log.info(chalk.gray(`v${version}`))
    }
  }
}

// @flow

import {
  Platform,
  tagOneLine
} from '@walmart/ern-util'
import chalk from 'chalk'

exports.command = 'ls'
exports.desc = 'List platform versions'

exports.builder = {}

exports.handler = function (argv: any) {
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

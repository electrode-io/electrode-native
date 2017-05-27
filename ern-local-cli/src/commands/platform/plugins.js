// @flow

import {
  platform,
  tagOneLine
} from '@walmart/ern-util'
import chalk from 'chalk'

exports.command = 'plugins [platformVersion]'
exports.desc = 'List supported platform plugins'

exports.builder = function (yargs: any) {
  return yargs
        .option('platformVersion', {
          alias: 'v',
          describe: 'Specific platform version for which to list supported plugins'
        })
}

exports.handler = function (argv: any) {
  const plugins = platform.getManifestPlugins(argv.platformVersion
        ? argv.platformVersion : platform.currentVersion)

  log.info(
        tagOneLine`Platform v${argv.platformVersion ? argv.platformVersion : platform.currentVersion}
    suports the following plugins`)
  for (const plugin of plugins) {
    console.log(
            `${chalk.yellow(`${plugin.scope ? `${plugin.scope}@` : ''}${plugin.name}`)}@${chalk.magenta(`${plugin.version}`)}`)
  }
}

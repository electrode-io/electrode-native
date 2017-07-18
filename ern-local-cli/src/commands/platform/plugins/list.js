// @flow

import {
  Manifest,
  Platform
} from '@walmart/ern-core'

import chalk from 'chalk'
import Table from 'cli-table'

exports.command = 'list [platformVersion]'
exports.desc = 'List supported platform plugins'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins'
    })
}

exports.handler = async function ({
  platformVersion = Platform.currentVersion
} : {
  platformVersion?: string
}) {
  const plugins = await Manifest.getTargetNativeDependencies(platformVersion)

  log.info(`Platform v${platformVersion} suports the following plugins`)
  var table = new Table({
    head: [
      chalk.cyan('Scope'),
      chalk.cyan('Name'),
      chalk.cyan('Version')
    ],
    colWidths: [10, 40, 16]
  })
  for (const plugin of plugins) {
    table.push([
      plugin.scope ? plugin.scope : '',
      plugin.name,
      plugin.version
    ])
  }
  console.log(table.toString())
}

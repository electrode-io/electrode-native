// @flow

import {
  manifest,
  Platform
} from 'ern-core'
import {
  Utils
} from 'ern-util'
import utils from '../../../lib/utils'

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
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  platformVersion = Platform.currentVersion
} : {
  platformVersion?: string
}) {
  try {
    const plugins = await manifest.getNativeDependencies(platformVersion)

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
    log.info(table.toString())
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

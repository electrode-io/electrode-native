import { manifest, Platform, utils as coreUtils, log } from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

import chalk from 'chalk'
import Table from 'cli-table'

export const command = 'list [platformVersion]'
export const desc = 'List supported platform plugins'

export const builder = (argv: Argv) => {
  return argv
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  platformVersion = Platform.currentVersion,
}: {
  platformVersion?: string
}) => {
  try {
    const plugins = await manifest.getNativeDependencies(platformVersion)

    log.info(`Platform v${platformVersion} suports the following plugins`)
    const table = new Table({
      colWidths: [40, 16],
      head: [chalk.cyan('Name'), chalk.cyan('Version')],
    })
    for (const plugin of plugins) {
      table.push([plugin.basePath, plugin.version])
    }
    log.info(table.toString())
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

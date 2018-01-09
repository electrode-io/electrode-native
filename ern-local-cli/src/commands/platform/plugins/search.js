// @flow

import {
  manifest,
  Platform,
  PackagePath,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

import chalk from 'chalk'

exports.command = 'search <name> [platformVersion]'
exports.desc = 'Search a plugin'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  name,
  platformVersion = Platform.currentVersion
} : {
  name: string,
  platformVersion?: string
}) {
  try {
    const plugin = await manifest.getNativeDependency(PackagePath.fromString(name), platformVersion)
    if (!plugin) {
      return log.warn(`No plugin named ${name} was found for platform version $platformVersion}`)
    }

    log.info(`${chalk.yellow(plugin.basePath)}@${chalk.magenta(plugin.version)}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

// @flow

import {
  Platform
} from '@walmart/ern-core'
import {
  Dependency
} from '@walmart/ern-util'
import chalk from 'chalk'
import Manifest from '../../../lib/Manifest'

exports.command = 'search <pluginName> [platformVersion]'
exports.desc = 'Search a plugin'

exports.builder = function (yargs: any) {
  return yargs
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins'
    })
}

exports.handler = async function ({
  pluginName,
  platformVersion = Platform.currentVersion
} : {
  pluginName: string,
  platformVersion?: string
}) {
  const plugin = await Manifest.getTargetNativeDependency(platformVersion, Dependency.fromString(pluginName))
  if (!plugin) {
    return log.warn(`No plugin named ${pluginName} was found for platform version $platformVersion}`)
  }

  const scopeStr = `${plugin.scope ? `${plugin.scope}@` : ''}`
  console.log(`${chalk.gray(scopeStr)}${chalk.yellow(plugin.name)}@${chalk.magenta(plugin.version)}`)
}

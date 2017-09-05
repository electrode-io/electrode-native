// @flow

import {
  manifest,
  Platform
} from 'ern-core'
import {
  Dependency
} from 'ern-util'
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
  const plugin = await manifest.getNativeDependency(Dependency.fromString(name), platformVersion)
  if (!plugin) {
    return log.warn(`No plugin named ${name} was found for platform version $platformVersion}`)
  }

  const scopeStr = `${plugin.scope ? `${plugin.scope}@` : ''}`
  console.log(`${chalk.gray(scopeStr)}${chalk.yellow(plugin.name)}@${chalk.magenta(plugin.version)}`)
}

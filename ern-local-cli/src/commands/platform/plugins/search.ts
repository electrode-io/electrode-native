import { manifest, Platform, PackagePath, log } from 'ern-core'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'

import chalk from 'chalk'

export const command = 'search <name> [platformVersion]'
export const desc = 'Search a plugin'

export const builder = (argv: Argv) => {
  return argv
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  name,
  platformVersion = Platform.currentVersion,
}: {
  name: string
  platformVersion?: string
}) => {
  const plugin = await manifest.getNativeDependency(
    PackagePath.fromString(name),
    platformVersion
  )
  if (!plugin) {
    return log.warn(
      `No plugin named ${name} was found for platform version ${platformVersion}`
    )
  }

  log.info(
    `${chalk.yellow(plugin.basePath)}@${chalk.magenta(plugin.version || '?')}`
  )
}

export const handler = tryCatchWrap(commandHandler)

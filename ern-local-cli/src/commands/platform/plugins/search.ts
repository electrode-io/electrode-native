import { log, manifest, PackagePath, Platform } from 'ern-core'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib'
import { Argv } from 'yargs'

import chalk from 'chalk'

export const command = 'search <name> [platformVersion]'
export const desc = 'Search a plugin'

export const builder = (argv: Argv) => {
  return argv
    .option('manifestId', {
      describe: 'Id of the Manifest entry in which to search plugins',
      type: 'string',
    })
    .option('platformVersion', {
      alias: 'v',
      describe: 'Specific platform version for which to list supported plugins',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  manifestId,
  name,
  platformVersion = Platform.currentVersion,
}: {
  manifestId?: string
  name: string
  platformVersion?: string
}) => {
  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    })
  }

  const plugin = await manifest.getNativeDependency(
    PackagePath.fromString(name),
    { manifestId, platformVersion }
  )
  if (!plugin) {
    return log.warn(
      `No plugin named ${name} was found for platform version ${platformVersion}`
    )
  }

  log.info(
    `${chalk.yellow(plugin.name!)}@${chalk.magenta(plugin.version || '?')}`
  )
}

export const handler = tryCatchWrap(commandHandler)

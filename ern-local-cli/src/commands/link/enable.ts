import { epilog, tryCatchWrap } from '../../lib'
import { getCurrentDirectoryPackageName } from './utils'
import { packageLinksConfig, log } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'enable [packageName]'
export const desc = 'Enable a package link'

export const builder = (argv: Argv) => {
  return argv
    .example(
      '$0 link enable',
      'Enable the link associated to the package present in current directory'
    )
    .example(
      '$0 link enable foo',
      `Enable the link associated to the 'foo' package`
    )
    .positional('packageName', {
      describe: 'Name of the package to enable link of',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  packageName,
}: { packageName?: string } = {}) => {
  packageName = packageName || (await getCurrentDirectoryPackageName())

  if (!packageLinksConfig.has(packageName!)) {
    throw new Error(`No link exist for ${packageName} package.`)
  }

  packageLinksConfig.enable(packageName!)

  log.info(`Link to ${packageName} package successfuly enabled.`)
}

export const handler = tryCatchWrap(commandHandler)

// TO BE REMOVED IN 0.41.0
import { epilog, tryCatchWrap } from '../lib'
import { getCurrentDirectoryPackageName } from './link/utils'
import { packageLinksConfig, log } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'unlink'
export const desc = 'Unlink a MiniApp'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  log.warn(`This command has been deprecated and will be removed in 0.41.0 release.
Please consider using 'ern link rm' command instead.`)
  const packageName = await getCurrentDirectoryPackageName()

  if (!packageLinksConfig.has(packageName!)) {
    throw new Error(`No link exist for ${packageName} package.`)
  }

  packageLinksConfig.remove(packageName!)

  log.info(`Link to ${packageName} package successfuly removed.`)
}

export const handler = tryCatchWrap(commandHandler)

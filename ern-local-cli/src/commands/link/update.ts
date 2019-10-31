import { epilog, tryCatchWrap } from '../../lib'
import { getCurrentDirectoryPackageName } from './utils'
import { packageLinksConfig, log } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'update'
export const desc = 'Update an existing package link location'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}
export const commandHandler = async () => {
  const packageName = await getCurrentDirectoryPackageName()

  if (!packageLinksConfig.has(packageName!)) {
    throw new Error(`No link exist for ${packageName} package.
The 'ern link add' command can be used to a add a new link.`)
  }

  packageLinksConfig.update(packageName!, process.cwd())

  log.info(`Link to ${packageName} package successfuly updated.
[${packageName} => ${process.cwd()}].`)
}

export const handler = tryCatchWrap(commandHandler)

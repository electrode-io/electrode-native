import { epilog, tryCatchWrap } from '../lib'
import { getCurrentDirectoryPackageName } from './link/utils'
import { packageLinksConfig, log } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'link'
export const desc = 'Commands to manage packages links'

export const builder = (argv: Argv) => {
  return argv
    .commandDir('link', {
      extensions: process.env.ERN_ENV === 'development' ? ['js', 'ts'] : ['js'],
    })
    .epilog(epilog(exports))
}

// COMMAND TO BE REMOVED IN 0.41.0
export const commandHandler = async () => {
  log.warn(`This command has been deprecated and will be removed in 0.41.0 release.
Please consider using 'ern link add' command instead.`)
  const packageName = await getCurrentDirectoryPackageName()

  if (packageLinksConfig.has(packageName)) {
    throw new Error(`A link already exist for ${packageName} package.
[${packageName} => ${packageLinksConfig.get(packageName).localPath}].
The 'ern link update' command can be used to update an existing link.`)
  }

  packageLinksConfig.add(packageName, process.cwd())

  log.info(`Link to ${packageName} successfuly added.
[${packageName} => ${process.cwd()}].`)
}

export const handler = tryCatchWrap(commandHandler)

import { epilog, tryCatchWrap } from '../../lib'
import { packageLinksConfig, log } from 'ern-core'
import { Argv } from 'yargs'

export const command = 'list'
export const desc = 'List all packages links'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  const packageLinks = packageLinksConfig.getAll()

  if (Object.keys(packageLinks).length > 0) {
    Object.keys(packageLinks).map(pkgName => {
      log.info(
        `${pkgName} => ${packageLinks[pkgName].localPath} [${
          packageLinks[pkgName].isEnabled ? 'enabled' : 'disabled'
        }]`
      )
    })
  } else {
    log.info(`No packages links.
The 'ern link add' command can be used to add a new package link.`)
  }
}

export const handler = tryCatchWrap(commandHandler)

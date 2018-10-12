import { log, MiniApp, PackagePath, utils as coreUtils } from 'ern-core'
import { epilog } from '../lib'
import { Argv } from 'yargs'

// Note : We use `pkg` instead of `package` because `package` is
// a reserved JavaScript word
export const command = 'add <packages..>'
export const desc = 'Add one or more package(s) to this miniapp'

export const builder = (argv: Argv) => {
  return argv
    .option('dev', {
      alias: 'd',
      default: false,
      describe: 'Add this/these packages to devDependencies',
      type: 'boolean',
    })
    .option('peer', {
      alias: 'p',
      default: false,
      describe: 'Add this/these packages to peerDependencies',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  dev,
  packages,
  peer,
}: {
  dev: boolean
  packages: string[]
  peer: boolean
}) => {
  try {
    for (const pkg of packages) {
      log.debug(`Adding package: ${pkg}`)
      await MiniApp.fromCurrentPath().addDependency(
        PackagePath.fromString(pkg),
        { dev, peer }
      )
      log.info(`Successfully added ${pkg}`)
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import { log, MiniApp, PackagePath, utils as coreUtils } from 'ern-core'
import utils from '../lib/utils'
import { Argv } from 'yargs'

// Note : We use `pkg` instead of `package` because `package` is
// a reserved JavaScript word
export const command = 'add <packages..>'
export const desc = 'Add one or more package(s) to this miniapp'

export const builder = (argv: Argv) => {
  return argv
    .option('dev', {
      alias: 'd',
      describe: 'Add this/these packages to devDependencies',
      type: 'boolean',
    })
    .option('peer', {
      alias: 'p',
      describe: 'Add this/these packages to peerDependencies',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  packages,
  dev = false,
  peer = false,
}: {
  packages: string[]
  dev: boolean
  peer: boolean
}) => {
  try {
    for (const pkg of packages) {
      log.debug(`Adding package: ${pkg}`)
      await MiniApp.fromCurrentPath().addDependency(
        PackagePath.fromString(pkg),
        { dev, peer }
      )
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

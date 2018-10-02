import { Platform, utils as coreUtils } from 'ern-core'
import { epilog } from '../../lib'
import { Argv } from 'yargs'

export const command = 'install <version>'
export const desc = 'Install a given ern platform version'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const handler = ({ version }: { version: string }) => {
  try {
    Platform.installPlatform(version.toString())
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

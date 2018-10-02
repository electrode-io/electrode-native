import { Platform, utils as coreUtils } from 'ern-core'
import { epilog } from '../../lib'
import { Argv } from 'yargs'

export const command = 'use <version>'
export const desc = 'Switch to a given ern platform version'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const handler = ({ version }: { version: string }) => {
  try {
    Platform.switchToVersion(version.toString())
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

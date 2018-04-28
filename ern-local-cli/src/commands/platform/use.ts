import { Platform, utils as coreUtils } from 'ern-core'
import utils from '../../lib/utils'
import { Argv } from 'yargs'

export const command = 'use <version>'
export const desc = 'Switch to a given ern platform version'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = ({ version }: { version: string }) => {
  try {
    Platform.switchToVersion(version.toString().replace('v', ''))
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

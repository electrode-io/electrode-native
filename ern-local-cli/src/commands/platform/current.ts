import { Platform, utils as coreUtils, log } from 'ern-core'
import utils from '../../lib/utils'
import { Argv } from 'yargs'

export const command = 'current'
export const desc = 'Show current platform version'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = () => {
  try {
    log.info(`Platform version : v${Platform.currentVersion}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils,
  log,
} from 'ern-core'
import { epilog } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'clear'
export const desc = 'Do not use any Cauldron'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const handler = () => {
  try {
    ernConfig.setValue('cauldronRepoInUse', undefined)
    shell.rm('-rf', Platform.cauldronDirectory)
    log.info(`Succesfully cleared any active Cauldron`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

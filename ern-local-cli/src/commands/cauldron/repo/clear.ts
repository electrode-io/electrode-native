import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils,
  log,
} from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'clear'
export const desc = 'Do not use any Cauldron'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = ({ alias }: { alias: string }) => {
  try {
    ernConfig.setValue('cauldronRepoInUse', undefined)
    shell.rm('-rf', Platform.cauldronDirectory)
    log.info(`Done.`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

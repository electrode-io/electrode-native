import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils,
  log,
} from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'use <alias>'
export const desc = 'Select a Cauldron repository to use'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = ({ alias }: { alias: string }) => {
  try {
    const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    if (!cauldronRepositories) {
      throw new Error('No Cauldron repositories have been added yet')
    }
    if (!cauldronRepositories[alias]) {
      throw new Error(`No Cauldron repository exists with ${alias} alias`)
    }
    ernConfig.setValue('cauldronRepoInUse', alias)
    shell.rm('-rf', Platform.cauldronDirectory)
    log.info(`${alias} Cauldron is now in use`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

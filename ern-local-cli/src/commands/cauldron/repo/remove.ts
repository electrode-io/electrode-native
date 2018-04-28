import { config as ernConfig, utils as coreUtils, log } from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'remove <alias>'
export const desc = 'Remove a cauldron repository given its alias'

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
    delete cauldronRepositories[alias]
    ernConfig.setValue('cauldronRepositories', cauldronRepositories)
    log.info(`Removed Cauldron repository exists with alias ${alias}`)
    const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
    if (cauldronRepoInUse === alias) {
      ernConfig.setValue('cauldronRepoInUse', null)
      log.info(
        `This Cauldron repository was the currently activated one. No more current repo !`
      )
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

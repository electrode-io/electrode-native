import { config as ernConfig, utils as coreUtils, log } from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'list'
export const desc = 'List all Cauldron repositories'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = () => {
  try {
    const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    if (!cauldronRepositories) {
      throw new Error('No Cauldron repositories have been added yet')
    }
    log.info('[Cauldron Repositories]')
    Object.keys(cauldronRepositories).forEach(alias =>
      log.info(`${alias} -> ${cauldronRepositories[alias]}`)
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

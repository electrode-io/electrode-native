import { config as ernConfig, utils as coreUtils, log } from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'current'
export const desc = 'Display the currently activated Cauldron repository'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = () => {
  try {
    const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
    if (!cauldronRepoInUse) {
      throw new Error(`No Cauldron repository is in use yet`)
    }
    const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    log.info(
      `${cauldronRepoInUse} [${cauldronRepositories[cauldronRepoInUse]}]`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

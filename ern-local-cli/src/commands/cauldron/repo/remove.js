// @flow

import {
  config as ernConfig,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'remove <alias>'
exports.desc = 'Remove a cauldron repository given its alias'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  alias
} : {
  alias: string
}) {
  try {
    let cauldronRepositories = ernConfig.getValue('cauldronRepositories')
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
      log.info(`This Cauldron repository was the currently activated one. No more current repo !`)
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

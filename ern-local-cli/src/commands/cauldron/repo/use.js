// @flow

import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'use <alias>'
exports.desc = 'Select a Cauldron repository to use'

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
    ernConfig.setValue('cauldronRepoInUse', alias)
    shell.rm('-rf', `${Platform.rootDirectory}/cauldron`)
    log.info(`${alias} Cauldron is now in use`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

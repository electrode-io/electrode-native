// @flow

import {
  config as ernConfig,
  Utils
} from 'ern-util'
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
      return console.log('No Cauldron repositories have been added yet')
    }
    if (!cauldronRepositories[alias]) {
      return console.log(`No Cauldron repository exists with ${alias} alias`)
    }
    delete cauldronRepositories[alias]
    ernConfig.setValue('cauldronRepositories', cauldronRepositories)
    console.log(`Removed Cauldron repository exists with alias ${alias}`)
    const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
    if (cauldronRepoInUse === alias) {
      ernConfig.setValue('cauldronRepoInUse', null)
      console.log(`This Cauldron repository was the currently activated one. No more current repo !`)
    }
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

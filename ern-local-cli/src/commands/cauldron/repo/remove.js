// @flow

import {
  config as ernConfig
} from 'ern-util'
import utils from '../../../lib/utils'

exports.command = 'remove <repoAlias>'
exports.desc = 'Remove a cauldron repository given its alias'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = function ({
  repoAlias
} : {
  repoAlias: string
}) {
  let cauldronRepositories = ernConfig.getValue('cauldronRepositories')
  if (!cauldronRepositories) {
    return console.log('No Cauldron repositories have been added yet')
  }
  if (!cauldronRepositories[repoAlias]) {
    return console.log(`No Cauldron repository exists with ${repoAlias} alias`)
  }
  delete cauldronRepositories[repoAlias]
  ernConfig.setValue('cauldronRepositories', cauldronRepositories)
  console.log(`Removed Cauldron repository exists with alias ${repoAlias}`)
  const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
  if (cauldronRepoInUse === repoAlias) {
    ernConfig.setValue('cauldronRepoInUse', null)
    console.log(`This Cauldron repository was the currently activated one. No more current repo !`)
  }
}

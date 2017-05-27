// @flow

import {
  config as ernConfig
} from '@walmart/ern-util'

exports.command = 'use <repoAlias>'
exports.desc = 'Select a Cauldron repository to use'

exports.builder = {}

exports.handler = function (argv: any) {
  let cauldronRepositories = ernConfig.getValue('cauldronRepositories')
  if (!cauldronRepositories) {
    return console.log('No Cauldron repositories have been added yet')
  }
  if (!cauldronRepositories[argv.repoAlias]) {
    return console.log(`No Cauldron repository exists with ${argv.repoAlias} alias`)
  }
  ernConfig.setValue('cauldronRepoInUse', argv.repoAlias)
  console.log(`${argv.repoAlias} Cauldron is now in use`)
}

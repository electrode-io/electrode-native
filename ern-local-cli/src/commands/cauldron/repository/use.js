// @flow

import {
  Platform
} from '@walmart/ern-core'
import {
  config as ernConfig
} from '@walmart/ern-util'
import shell from 'shelljs'

exports.command = 'use <repoAlias>'
exports.desc = 'Select a Cauldron repository to use'

exports.builder = {}

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
  ernConfig.setValue('cauldronRepoInUse', repoAlias)
  shell.rm('-rf', `${Platform.rootDirectory}/cauldron`)
  console.log(`${repoAlias} Cauldron is now in use`)
}

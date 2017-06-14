// @flow

import {
  config as ernConfig
} from '@walmart/ern-util'

exports.command = 'add <repoAlias> <repoUrl>'
exports.desc = 'Add a Cauldron git repository'

exports.builder = {}

exports.handler = function ({
  repoAlias,
  repoUrl
} : {
  repoAlias: string,
  repoUrl: string
}) {
  let cauldronRepositories = ernConfig.getValue('cauldronRepositories', {})
  if (cauldronRepositories[repoAlias]) {
    return console.log(`A Cauldron repository is already associated to ${repoAlias} alias`)
  }
  cauldronRepositories[repoAlias] = repoUrl
  ernConfig.setValue('cauldronRepositories', cauldronRepositories)
  console.log(`Added Cauldron repository ${repoUrl} with alias ${repoAlias}`)
}

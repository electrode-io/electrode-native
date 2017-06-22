// @flow

import {
  config as ernConfig
} from '@walmart/ern-util'
import shell from 'shelljs'

exports.command = 'add <repoAlias> <repoUrl> [current]'
exports.desc = 'Add a Cauldron git repository'

exports.builder = function (yargs: any) {
  return yargs
    .option('current', {
      type: 'boolean',
      describe: 'set repoAlias as the current Cauldron repository'
    })
}

exports.handler = function ({
  repoAlias,
  repoUrl,
  current
} : {
  repoAlias: string,
  repoUrl: string,
  current: boolean,
}) {
  let cauldronRepositories = ernConfig.getValue('cauldronRepositories', {})
  if (cauldronRepositories[repoAlias]) {
    return console.log(`A Cauldron repository is already associated to ${repoAlias} alias`)
  }
  cauldronRepositories[repoAlias] = repoUrl
  ernConfig.setValue('cauldronRepositories', cauldronRepositories)
  console.log(`Added Cauldron repository ${repoUrl} with alias ${repoAlias}`)
  if (current) {
    shell.exec(`ern cauldron repository use ${repoAlias}`)
  }
}

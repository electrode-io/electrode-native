// @flow

import {
  config as ernConfig
} from '@walmart/ern-util'
import shell from 'shelljs'
import inquirer from 'inquirer'

exports.command = 'add <repoAlias> <repoUrl> [current]'
exports.desc = 'Add a Cauldron git repository'

exports.builder = function (yargs: any) {
  return yargs
    .option('current', {
      type: 'boolean',
      describe: 'Set repo as the current Cauldron repository',
      default: undefined
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
    runUseCauldronRepositoryCommand(repoAlias)
  } else if (!(current === false)) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'current',
      message: `Set ${repoAlias} as the current Cauldron repository`
    }]).then(answers => {
      if (answers.current) {
        runUseCauldronRepositoryCommand(repoAlias)
      }
    })
  }
}

function runUseCauldronRepositoryCommand (repoAlias: string) {
  shell.exec(`ern cauldron repository use ${repoAlias}`)
}

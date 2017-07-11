// @flow

import {
  config as ernConfig,
  Platform
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
    useCauldronRepository(repoAlias)
  } else if (!(current === false)) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'current',
      message: `Set ${repoAlias} as the current Cauldron repository`
    }]).then(answers => {
      if (answers.current) {
        useCauldronRepository(repoAlias)
      }
    })
  }
}

function useCauldronRepository (repoAlias: string) {
  ernConfig.setValue('cauldronRepoInUse', repoAlias)
  shell.rm('-rf', `${Platform.rootDirectory}/cauldron`)
  log.info(`${repoAlias} Cauldron is now in use`)
}

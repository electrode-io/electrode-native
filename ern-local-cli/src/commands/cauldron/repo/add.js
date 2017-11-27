// @flow

import {
  Platform
} from 'ern-core'
import {
  config as ernConfig,
  shell,
  Utils
} from 'ern-util'
import inquirer from 'inquirer'
import utils from '../../../lib/utils'

exports.command = 'add <alias> <url> [current]'
exports.desc = 'Add a Cauldron git repository'

exports.builder = function (yargs: any) {
  return yargs
    .option('current', {
      type: 'boolean',
      describe: 'Set repo as the current Cauldron repository',
      default: undefined
    })
    .epilog(utils.epilog(exports))
}

exports.handler = function ({
  alias,
  url,
  current
} : {
  alias: string,
  url: string,
  current: boolean,
}) {
  try {
    if (!url.startsWith('git@')) {
      throw new Error('Please provide the SSH url of your git repo (the one starting with git@)')
    }

    let cauldronRepositories = ernConfig.getValue('cauldronRepositories', {})
    if (cauldronRepositories[alias]) {
      throw new Error(`A Cauldron repository is already associated to ${alias} alias`)
    }
    cauldronRepositories[alias] = url
    ernConfig.setValue('cauldronRepositories', cauldronRepositories)
    log.info(`Added Cauldron repository ${url} with alias ${alias}`)
    if (current) {
      useCauldronRepository(alias)
    } else if (!(current === false)) {
      inquirer.prompt([{
        type: 'confirm',
        name: 'current',
        message: `Set ${alias} as the current Cauldron repository`
      }]).then(answers => {
        if (answers.current) {
          useCauldronRepository(alias)
        }
      })
    }
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

function useCauldronRepository (alias: string) {
  ernConfig.setValue('cauldronRepoInUse', alias)
  shell.rm('-rf', `${Platform.rootDirectory}/cauldron`)
  log.info(`${alias} Cauldron is now activated`)
}

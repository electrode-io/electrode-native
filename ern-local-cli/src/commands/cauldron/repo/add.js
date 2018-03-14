// @flow

import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils
} from 'ern-core'
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

const supportedGitHttpsSchemeRe = /(^https:\/\/.+:.+@.+$)|(^https:\/\/.+@.+$)/

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
    if (url.startsWith('https')) {
      if (!supportedGitHttpsSchemeRe.test(url)) {
        throw new Error(`Cauldron https urls have to be formatted as : 
https://[username]:[password]@[repourl]
OR
https://[token]@[repourl]`)
      }
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
    coreUtils.logErrorAndExitProcess(e)
  }
}

function useCauldronRepository (alias: string) {
  ernConfig.setValue('cauldronRepoInUse', alias)
  shell.rm('-rf', Platform.cauldronDirectory)
  log.info(`${alias} Cauldron is now activated`)
}

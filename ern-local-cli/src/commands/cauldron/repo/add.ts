import {
  Platform,
  config as ernConfig,
  shell,
  utils as coreUtils,
  log,
} from 'ern-core'
import inquirer from 'inquirer'
import path from 'path'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'add <alias> <url> [current]'
export const desc = 'Add a Cauldron git repository'

export const builder = (argv: Argv) => {
  return argv
    .option('current', {
      default: undefined,
      describe: 'Set repo as the current Cauldron repository',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

const supportedGitHttpsSchemeRe = /(^https:\/\/.+:.+@.+$)|(^https:\/\/.+@.+$)/

export const handler = ({
  alias,
  url,
  current,
}: {
  alias: string
  url: string
  current: boolean
}) => {
  try {
    let cauldronUrl = url
    if (cauldronUrl.startsWith('https')) {
      if (!supportedGitHttpsSchemeRe.test(cauldronUrl)) {
        throw new Error(`Cauldron https urls have to be formatted as : 
https://[username]:[password]@[repourl]
OR
https://[token]@[repourl]`)
      }
    }

    const cauldronRepositories = ernConfig.getValue('cauldronRepositories', {})
    if (cauldronRepositories[alias]) {
      throw new Error(
        `A Cauldron repository is already associated to ${alias} alias`
      )
    }

    if (cauldronUrl === 'local') {
      cauldronUrl = path.join(Platform.localCauldronsDirectory, alias)
    }
    cauldronRepositories[alias] = cauldronUrl
    ernConfig.setValue('cauldronRepositories', cauldronRepositories)
    log.info(`Added Cauldron repository ${cauldronUrl} with alias ${alias}`)
    if (current) {
      useCauldronRepository(alias)
    } else if (!(current === false)) {
      inquirer
        .prompt([
          <inquirer.Question>{
            message: `Set ${alias} as the current Cauldron repository`,
            name: 'current',
            type: 'confirm',
          },
        ])
        .then(answers => {
          if (answers.current) {
            useCauldronRepository(alias)
          }
        })
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

function useCauldronRepository(alias: string) {
  ernConfig.setValue('cauldronRepoInUse', alias)
  shell.rm('-rf', Platform.cauldronDirectory)
  log.info(`${alias} Cauldron is now activated`)
}

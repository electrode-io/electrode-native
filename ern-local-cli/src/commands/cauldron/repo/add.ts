import { Platform, config as ernConfig, shell, log } from 'ern-core'
import path from 'path'
import { epilog, tryCatchWrap, askUserConfirmation } from '../../../lib'
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
    .epilog(epilog(exports))
}

const supportedGitHttpsSchemeRe = /(^https:\/\/.+:.+@.+$)|(^https:\/\/.+@.+$)/

export const commandHandler = async ({
  alias,
  current,
  url,
}: {
  alias: string
  current: boolean
  url: string
}) => {
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
    throw new Error(`A Cauldron repository already exists with ${alias} alias`)
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
    if (
      await askUserConfirmation(`Set ${alias} as current Cauldron repository ?`)
    ) {
      useCauldronRepository(alias)
    }
  }
}

function useCauldronRepository(alias: string) {
  ernConfig.setValue('cauldronRepoInUse', alias)
  shell.rm('-rf', Platform.cauldronDirectory)
  log.info(`${alias} Cauldron is now activated`)
}

export const handler = tryCatchWrap(commandHandler)

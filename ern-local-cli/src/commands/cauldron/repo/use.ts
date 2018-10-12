import { Platform, config as ernConfig, shell, log } from 'ern-core'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'use <alias>'
export const desc = 'Select a Cauldron repository to use'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async ({ alias }: { alias: string }) => {
  const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
  if (!cauldronRepositories) {
    throw new Error('No Cauldron repositories have been added yet')
  }
  if (!cauldronRepositories[alias]) {
    throw new Error(`No Cauldron repository exists with ${alias} alias`)
  }
  ernConfig.setValue('cauldronRepoInUse', alias)
  shell.rm('-rf', Platform.cauldronDirectory)
  log.info(`${alias} Cauldron is now activated`)
}

export const handler = tryCatchWrap(commandHandler)

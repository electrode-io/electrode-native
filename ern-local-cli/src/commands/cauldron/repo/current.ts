import { config as ernConfig, log } from 'ern-core'
import { epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'current'
export const desc = 'Display the currently activated Cauldron repository'

export const builder = (argv: Argv) => {
  return argv.epilog(epilog(exports))
}

export const commandHandler = async () => {
  const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
  if (!cauldronRepoInUse) {
    throw new Error(`No Cauldron repository is in use yet`)
  }
  const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
  log.info(`${cauldronRepoInUse} [${cauldronRepositories[cauldronRepoInUse]}]`)
}

export const handler = tryCatchWrap(commandHandler)

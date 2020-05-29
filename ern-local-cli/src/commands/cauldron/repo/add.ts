import { log } from 'ern-core'
import { askUserConfirmation, epilog, tryCatchWrap } from '../../../lib'
import { Argv } from 'yargs'
import { cauldronRepositories } from 'ern-cauldron-api'

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

export const commandHandler = async ({
  alias,
  current,
  url,
}: {
  alias: string
  current: boolean
  url: string
}) => {
  if (current === undefined) {
    current = await askUserConfirmation(
      `Set ${alias} as current Cauldron repository ?`
    )
  }

  cauldronRepositories.add(alias, url, { activate: current })

  log.info(`Added Cauldron repository ${url} with alias ${alias}`)
}

export const handler = tryCatchWrap(commandHandler)

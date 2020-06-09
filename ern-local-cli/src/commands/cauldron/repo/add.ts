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
    .option('force', {
      alias: 'f',
      describe: 'Overwrite an existing alias with the same name',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  alias,
  current,
  force,
  url,
}: {
  alias: string
  current: boolean
  force: boolean
  url: string
}) => {
  const activate =
    current ??
    (await askUserConfirmation(`Set ${alias} as current Cauldron repository?`))

  cauldronRepositories.add(alias, url, { activate, force })

  log.info(`Added Cauldron repository ${url} with alias ${alias}`)
}

export const handler = tryCatchWrap(commandHandler)

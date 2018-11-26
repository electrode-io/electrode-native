import { Argv } from 'yargs'
import { epilog, parseArgValue, tryCatchWrap } from '../../../lib'
import { getActiveCauldron } from 'ern-cauldron-api'
import { NativeApplicationDescriptor, log } from 'ern-core'

export const command = 'set'
export const desc = 'Sets configuration stored in Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe:
        'Partial or full native application descriptor for which to set config (top level config if not specified)',
      type: 'string',
    })
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .option('key', {
      describe: 'The config key (set the whole config object if not specified)',
      type: 'string',
    })
    .option('value', {
      describe:
        'Value to be set for this config key. If JSON, it can be provided as a string, or json file path or cauldron file path.',
      required: true,
    })

    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  key,
  value,
}: {
  descriptor?: NativeApplicationDescriptor
  key?: string
  value: any
}) => {
  const cauldron = await getActiveCauldron({
    ignoreRequiredErnVersionMismatch: true,
  })
  await cauldron.setConfig({
    descriptor,
    key,
    value: await parseArgValue(value),
  })
  log.info(
    `Successfully set ${key && `for key ${key}`} of ${
      descriptor ? descriptor : 'Cauldron'
    }`
  )
}

export const handler = tryCatchWrap(commandHandler)

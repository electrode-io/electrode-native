import { Argv } from 'yargs'
import { epilog } from '../../../lib'
import { getActiveCauldron } from 'ern-cauldron-api'
import { utils as coreUtils, NativeApplicationDescriptor } from 'ern-core'

export const command = 'get'
export const desc = 'Echoes configuration stored in Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe:
        'Partial or full native application descriptor for which to get the config from (top level config if not specified)',
      type: 'string',
    })
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .option('key', {
      describe:
        'The config key (echoes the whole config object if not specified)',
      type: 'string',
    })
    .option('strict', {
      default: false,
      describe: 'Echoes the config strictly associated to the descriptor',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
  key,
  strict,
}: {
  descriptor?: NativeApplicationDescriptor
  key?: string
  strict: boolean
}) => {
  try {
    const cauldron = await getActiveCauldron()

    let result: any
    if (key && strict) {
      result = await cauldron.getConfigForKeyStrict(key, descriptor)
    } else if (key && !strict) {
      result = await cauldron.getConfigForKey(key, descriptor)
    } else if (!key && strict) {
      result = await cauldron.getConfigStrict(descriptor)
    } else if (!key && !strict) {
      result = await cauldron.getConfig(descriptor)
    }
    const jsonConfig = JSON.stringify(result, null, 2)
    console.log(jsonConfig)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

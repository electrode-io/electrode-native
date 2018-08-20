import { Argv } from 'yargs'
import utils from '../../../lib/utils'
import { getActiveCauldron } from 'ern-cauldron-api'
import { utils as coreUtils, NativeApplicationDescriptor } from 'ern-core'

export const command = 'get'
export const desc = 'Echoes configuration stored in Cauldron'

export const builder = (argv: Argv) => {
  return argv
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
    .option('descriptor', {
      describe:
        'Partial or full native application descriptor for which to get the config from (top level config if not specified)',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  key,
  strict,
}: {
  descriptor?: string
  key?: string
  strict: boolean
}) => {
  try {
    const cauldron = await getActiveCauldron()
    if (!cauldron) {
      throw new Error('A Cauldron must be active in order to use this command')
    }

    const napDescriptor = descriptor
      ? NativeApplicationDescriptor.fromString(descriptor)
      : undefined

    let result: any
    if (key && strict) {
      result = await cauldron.getConfigForKeyStrict(key, napDescriptor)
    } else if (key && !strict) {
      result = await cauldron.getConfigForKey(key, napDescriptor)
    } else if (!key && strict) {
      result = await cauldron.getConfigStrict(napDescriptor)
    } else if (!key && !strict) {
      result = await cauldron.getConfig(napDescriptor)
    }
    const jsonConfig = JSON.stringify(result, null, 2)
    console.log(jsonConfig)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import { Argv } from 'yargs'
import utils from '../../../lib/utils'
import { getActiveCauldron } from 'ern-cauldron-api'
import { utils as coreUtils, NativeApplicationDescriptor, log } from 'ern-core'

export const command = 'set'
export const desc = 'Sets configuration stored in Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('key', {
      describe: 'The config key (set the whole config object if not specified)',
      type: 'string',
    })
    .option('descriptor', {
      describe:
        'Partial or full native application descriptor for which to set config (top level config if not specified)',
      type: 'string',
    })
    .option('value', {
      describe:
        'Value to be set for this config key. If JSON, it can be provided as a string, or json file path or cauldron file path.',
      required: true,
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  key,
  value,
}: {
  descriptor?: string
  key?: string
  value: any
}) => {
  try {
    const cauldron = await getActiveCauldron()
    await cauldron.setConfig({
      descriptor: descriptor
        ? NativeApplicationDescriptor.fromString(descriptor)
        : undefined,
      key,
      value: await utils.parseArgValue(value),
    })
    log.info(
      `Successfuly set config ${key && `for key ${key}`} of ${
        descriptor ? descriptor : 'Cauldron'
      }`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

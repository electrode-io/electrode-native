import { Argv } from 'yargs'
import { epilog } from '../../../lib'
import { getActiveCauldron } from 'ern-cauldron-api'
import { utils as coreUtils, NativeApplicationDescriptor, log } from 'ern-core'

export const command = 'del'
export const desc = 'Deletes configuration stored in Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe:
        'Partial or full native application descriptor for which to delete config (top level config if not specified)',
      type: 'string',
    })
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .option('key', {
      describe:
        'The config key (deletes the whole config object if not specified)',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
  key,
}: {
  descriptor?: NativeApplicationDescriptor
  key?: string
}) => {
  try {
    const cauldron = await getActiveCauldron()
    await cauldron.delConfig({
      descriptor,
      key,
    })
    log.info(
      `Successfully deleted ${key && `for key ${key}`} of ${
        descriptor ? descriptor : 'Cauldron'
      }`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

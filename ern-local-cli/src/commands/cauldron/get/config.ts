import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'config <descriptor>'
export const desc = 'Get configuration from the cauldron'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({ descriptor }: { descriptor: string }) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })

  try {
    const cauldron = await getActiveCauldron()
    const config = await cauldron.getConfig(
      NativeApplicationDescriptor.fromString(descriptor)
    )
    log.info(JSON.stringify(config, null, 2))
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

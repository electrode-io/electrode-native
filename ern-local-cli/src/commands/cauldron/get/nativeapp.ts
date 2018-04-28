import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'nativeapp [descriptor]'
export const desc = 'Get a native application from the cauldron'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({ descriptor }: { descriptor?: string }) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })

  try {
    const cauldron = await getActiveCauldron()
    if (!descriptor) {
      const napDescriptors = await utils.getNapDescriptorStringsFromCauldron()
      napDescriptors.forEach(n => log.info(n))
    } else {
      const nativeApp = await cauldron.getDescriptor(
        NativeApplicationDescriptor.fromString(descriptor)
      )
      log.info(JSON.stringify(nativeApp, null, 1))
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

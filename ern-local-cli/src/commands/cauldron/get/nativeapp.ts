import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'nativeapp [descriptor]'
export const desc = 'Get a native application from the cauldron'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', NativeApplicationDescriptor.fromString)
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
}: {
  descriptor?: NativeApplicationDescriptor
}) => {
  await logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })

  try {
    const cauldron = await getActiveCauldron()
    if (!descriptor) {
      const napDescriptors = await cauldron.getNapDescriptorStrings()
      napDescriptors.forEach(n => log.info(n))
    } else {
      const nativeApp = await cauldron.getDescriptor(descriptor)
      log.info(JSON.stringify(nativeApp, null, 1))
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

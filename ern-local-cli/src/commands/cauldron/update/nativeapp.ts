import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'nativeapp <descriptor> [isReleased]'
export const desc = 'Update a native application info in cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('isReleased', {
      alias: 'r',
      default: true,
      describe: 'true if version is released, false otherwise',
      type: 'boolean',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
  isReleased = true,
}: {
  descriptor: NativeApplicationDescriptor
  isReleased: boolean
}) => {
  try {
    await logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot update the release status of a non existing native application version',
      },
    })

    const cauldron = await getActiveCauldron()
    cauldron.updateNativeAppIsReleased(descriptor, isReleased)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

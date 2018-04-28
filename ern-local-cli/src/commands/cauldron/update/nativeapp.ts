import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
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
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  isReleased = true,
}: {
  descriptor: string
  isReleased: boolean
}) => {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot update the release status of a non existing native application version',
      },
    })

    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    const cauldron = await getActiveCauldron()
    cauldron.updateNativeAppIsReleased(napDescriptor, isReleased)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'nativeapp <descriptor>'
export const desc = 'Remove a native application from the cauldron'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

export const handler = async ({
  descriptor,
}: {
  descriptor: NativeApplicationDescriptor
}) => {
  await logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot remove a native application version that do not exist in Cauldron.',
    },
  })

  try {
    const cauldron = await getActiveCauldron()
    await cauldron.removeDescriptor(descriptor)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

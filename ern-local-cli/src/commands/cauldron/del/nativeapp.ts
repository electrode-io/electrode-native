import { NativeApplicationDescriptor, utils as coreUtils } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'nativeapp <descriptor>'
export const desc = 'Remove a native application from the cauldron'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({ descriptor }: { descriptor: string }) => {
  await utils.logErrorAndExitIfNotSatisfied({
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
    await cauldron.removeDescriptor(
      NativeApplicationDescriptor.fromString(descriptor)
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'

export const command = 'dependency <descriptor>'
export const desc =
  'Get all the native dependencies of a given native application'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({ descriptor }: { descriptor: string }) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
    isCompleteNapDescriptorString: { descriptor },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  try {
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    const cauldron = await getActiveCauldron()
    const dependencies = await cauldron.getNativeDependencies(napDescriptor)
    for (const dependency of dependencies) {
      log.info(dependency.toString())
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import { NativeApplicationDescriptor, utils as coreUtils, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../../lib'
import { Argv } from 'yargs'

export const command = 'dependency <descriptor>'
export const desc =
  'Get all the native dependencies of a given native application'

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
  try {
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
    })

    const cauldron = await getActiveCauldron()
    const dependencies = await cauldron.getNativeDependencies(descriptor)
    for (const dependency of dependencies) {
      log.info(dependency.toString())
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

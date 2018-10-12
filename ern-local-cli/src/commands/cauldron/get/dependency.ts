import { NativeApplicationDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib'
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

export const commandHandler = async ({
  descriptor,
}: {
  descriptor: NativeApplicationDescriptor
}) => {
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
}

export const handler = tryCatchWrap(commandHandler)

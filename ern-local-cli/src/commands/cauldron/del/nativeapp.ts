import { NativeApplicationDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib'
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

export const commandHandler = async ({
  descriptor,
}: {
  descriptor: NativeApplicationDescriptor
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot remove a native application version that do not exist in Cauldron.',
    },
  })
  const cauldron = await getActiveCauldron()
  await cauldron.removeDescriptor(descriptor)
  log.info(`${descriptor} successfully removed from the Cauldron`)
}

export const handler = tryCatchWrap(commandHandler)

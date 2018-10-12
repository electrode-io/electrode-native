import { NativeApplicationDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../../lib'
import { Argv } from 'yargs'

export const command = 'nativeapp <descriptor> [isReleased]'
export const desc = 'Update a native application info in cauldron'

export const builder = (argv: Argv) => {
  return argv
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('isReleased', {
      alias: 'r',
      default: true,
      describe: 'true if version is released, false otherwise',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  isReleased = true,
}: {
  descriptor: NativeApplicationDescriptor
  isReleased: boolean
}) => {
  await logErrorAndExitIfNotSatisfied({
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'You cannot update the release status of a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()
  cauldron.updateNativeAppIsReleased(descriptor, isReleased)
  log.info(`Successfully updated release status of ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

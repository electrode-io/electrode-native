import { NativeApplicationDescriptor, log } from 'ern-core'
import { getBinaryStoreFromCauldron } from 'ern-orchestrator'
import { epilog, logErrorAndExitIfNotSatisfied } from '../../lib'
import { Argv } from 'yargs'

export const command = 'remove <descriptor>'
export const desc = 'Remove a mobile application binary from the binary store'

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
      napDescriptorExistInCauldron: { descriptor },
    })

    const binaryStore = await getBinaryStoreFromCauldron()
    await binaryStore.removeBinary(descriptor)
    log.info(`${descriptor} binary was successfuly removed from the store`)
  } catch (e) {
    log.error(`An error occurred while trying to remove ${descriptor} binary`)
  }
}

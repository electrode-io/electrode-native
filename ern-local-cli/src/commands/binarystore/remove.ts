import { NativeApplicationDescriptor, ErnBinaryStore, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
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
  await logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'Cannot add binary of a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()
  const binaryStoreConfig = await cauldron.getBinaryStoreConfig()
  if (!binaryStoreConfig) {
    return log.error('No binaryStore configuration was found in Cauldron')
  }

  try {
    const binaryStore = new ErnBinaryStore(binaryStoreConfig)
    if (!(await binaryStore.hasBinary(descriptor))) {
      return log.error(`No binary was found in the store for ${descriptor}`)
    }
    await binaryStore.removeBinary(descriptor)
    log.info(`${descriptor} binary was successfuly removed from the store`)
  } catch (e) {
    log.error(`An error occurred while trying to remove ${descriptor} binary`)
  }
}

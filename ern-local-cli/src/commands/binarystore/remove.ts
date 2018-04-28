import { NativeApplicationDescriptor, ErnBinaryStore, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../lib/utils'
import { Argv } from 'yargs'

export const command = 'remove <descriptor>'
export const desc = 'Remove a mobile application binary from the binary store'

export const builder = (argv: Argv) => {
  return argv.epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  pathToBinary,
}: {
  descriptor: string
  pathToBinary: string
}) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
    isCompleteNapDescriptorString: {
      descriptor,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'Cannot add binary of a non existing native application version',
    },
  })

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const cauldron = await getActiveCauldron()
  const binaryStoreConfig = await cauldron.getBinaryStoreConfig()
  if (!binaryStoreConfig) {
    return log.error('No binaryStore configuration was found in Cauldron')
  }

  try {
    const binaryStore = new ErnBinaryStore(binaryStoreConfig)
    if (!(await binaryStore.hasBinary(napDescriptor))) {
      return log.error(
        `No binary was found in the store for ${napDescriptor.toString()}`
      )
    }
    await binaryStore.removeBinary(napDescriptor)
    log.info(
      `${napDescriptor.toString()} binary was successfuly removed from the store`
    )
  } catch (e) {
    log.error(
      `An error occurred while trying to remove ${napDescriptor.toString()} binary`
    )
  }
}

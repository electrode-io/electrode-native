// @flow

import {
  NativeApplicationDescriptor,
  utils as coreUtils,
  ErnBinaryStore
} from 'ern-core'
import utils from '../../lib/utils'

exports.command = 'remove <descriptor>'
exports.desc = 'Remove a mobile application binary from the binary store'

exports.builder = function (yargs: any) {
  return yargs
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  pathToBinary
}: {
  descriptor: string,
  pathToBinary: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    },
    isCompleteNapDescriptorString: {
      descriptor
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage: 'Cannot add binary of a non existing native application version'
    }
  })

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const cauldron = await coreUtils.getCauldronInstance()
  const binaryStoreConfig = await cauldron.getBinaryStoreConfig()
  if (!binaryStoreConfig) {
    return log.error('No binaryStore configuration was found in Cauldron')
  }

  try {
    const binaryStore = new ErnBinaryStore(binaryStoreConfig)
    if (!await binaryStore.hasBinary(napDescriptor)) {
      return log.error(`No binary was found in the store for ${napDescriptor.toString()}`)
    }
    await binaryStore.removeBinary(napDescriptor)
    log.info(`${napDescriptor.toString()} binary was successfuly removed from the store`)
  } catch (e) {
    log.error(`An error occurred while trying to remove ${napDescriptor.toString()} binary`)
  }
}

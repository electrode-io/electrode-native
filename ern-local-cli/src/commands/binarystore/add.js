// @flow

import {
  NativeApplicationDescriptor,
  ErnBinaryStore,
  utils as coreUtils
} from 'ern-core'
import utils from '../../lib/utils'
import path from 'path'

exports.command = 'add <descriptor> <pathToBinary>'
exports.desc = 'Add a mobile application binary to the binary store'

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
    const absolutePathToBinary = path.resolve(pathToBinary)
    await binaryStore.addBinary(napDescriptor, absolutePathToBinary)
    log.info(`Binary was successfuly added to the store for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error occurred while trying to add the binary of ${napDescriptor.toString()}`)
  }
}

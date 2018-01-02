// @flow

import {
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp <descriptor> [isReleased]'
exports.desc = 'Update a native application info in cauldron'

exports.builder = function (yargs: any) {
  return yargs
    .option('isReleased', {
      alias: 'r',
      type: 'bool',
      default: true,
      describe: 'true if version is released, false otherwise'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  isReleased = true
} : {
  descriptor: string,
  isReleased: boolean
}) {
  try {
    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage: 'A Cauldron must be active in order to use this command'
      },
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'You cannot update the release status of a non existing native application version'
      }
    })

    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    const cauldron = await coreUtils.getCauldronInstance()
    cauldron.updateNativeAppIsReleased(napDescriptor, isReleased)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

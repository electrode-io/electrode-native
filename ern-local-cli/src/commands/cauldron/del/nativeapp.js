// @flow

import {
  NativeApplicationDescriptor,
  Utils
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp <descriptor>'
exports.desc = 'Remove a native application from the cauldron'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor
} : {
  descriptor: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    },
    isCompleteNapDescriptorString: { descriptor },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessahe: 'This command cannot remove a native application version that do not exist in Cauldron.'
    }
  })

  try {
    await cauldron.removeNativeApp(NativeApplicationDescriptor.fromString(descriptor))
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

// @flow

import {
  NativeApplicationDescriptor,
  Utils
} from 'ern-util'
import {
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp <descriptor>'
exports.desc = 'Get a native application from the cauldron'

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
      extraErrorMessage: 'This command cannot work on a non existing native application version'
    }
  })

  try {
    const cauldron = await coreUtils.getCauldronInstance()
    const nativeApp = await cauldron.getNativeApp(NativeApplicationDescriptor.fromString(descriptor))
    log.info(JSON.stringify(nativeApp, null, 1))
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

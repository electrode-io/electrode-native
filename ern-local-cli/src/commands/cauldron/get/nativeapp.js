// @flow

import {
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp [descriptor]'
exports.desc = 'Get a native application from the cauldron'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor
} : {
  descriptor?: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    }
  })

  try {
    const cauldron = await coreUtils.getCauldronInstance()
    if (!descriptor) {
      const napDescriptors = await utils.getNapDescriptorStringsFromCauldron()
      napDescriptors.forEach(n => log.info(n))
    } else {
      const nativeApp = await cauldron.getDescriptor(NativeApplicationDescriptor.fromString(descriptor))
      log.info(JSON.stringify(nativeApp, null, 1))
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

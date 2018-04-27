// @flow

import {
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import {
  getActiveCauldron
} from 'ern-cauldron-api'
import utils from '../../../lib/utils'

exports.command = 'dependency <descriptor>'
exports.desc = 'Get all the native dependencies of a given native application'

exports.builder = function (yargs:any) {
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
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
    const cauldron = await getActiveCauldron()
    const dependencies = await cauldron.getNativeDependencies(napDescriptor)
    for (const dependency of dependencies) {
      log.info(dependency.toString())
    }
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

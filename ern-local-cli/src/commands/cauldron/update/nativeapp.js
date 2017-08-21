// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'nativeapp <descriptor> [isReleased]'
exports.desc = 'Update a native application info in cauldron'

exports.builder = function (yargs: any) {
  return yargs
    .option('isReleased', {
      alias: 'r',
      type: 'bool',
      describe: 'true if version is released, false otherwise'
    })
}

exports.handler = async function ({
  descriptor,
  isReleased
} : {
  descriptor: string,
  isReleased?: boolean
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor
  })

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
  if (isReleased !== undefined) {
    cauldron.updateNativeAppIsReleased(napDescriptor, isReleased)
  }
}

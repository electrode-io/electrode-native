// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'

exports.command = 'nativeapp <completeNapDescriptor> [isReleased]'
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
  completeNapDescriptor,
  isReleased
} : {
  completeNapDescriptor: string,
  isReleased?: boolean
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  if (isReleased !== undefined) {
    cauldron.updateNativeAppIsReleased(napDescriptor, isReleased)
  }
}

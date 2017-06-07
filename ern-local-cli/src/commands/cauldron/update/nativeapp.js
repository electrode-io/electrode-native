// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'nativeapp <completeNapDescriptor> [isReleased]'
exports.desc = 'Update a native application info in cauldron'

exports.builder = function (yargs: any) {
  return yargs
        .option('isReleased', {
          alias: 'r',
          type: 'bool',
          describe: 'true if version is released, false otherwise'
        }).demandCommand(1, 'nativeapp needs <completeNapDescriptor>')
}

exports.handler = async function (argv: any) {
  const napDescriptor = NativeApplicationDescriptor.fromString(argv.completeNapDescriptor)
  if (argv.isReleased !== undefined) {
    cauldron.updateNativeAppIsReleased(napDescriptor, argv.isReleased)
  }
}

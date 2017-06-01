// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'nativeapp <completeNapDescriptor> [platformVersion]'
exports.desc = 'Add a native application to the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('platformVersion', {
    alias: 'v',
    describe: 'Platform version'
  })
}

exports.handler = async function (argv: any) {
  const napDescriptor = NativeApplicationDescriptor.fromString(argv.completeNapDescriptor)
  if (napDescriptor.isPartial) {
    return log.error('You need to provide a complete native application descriptor to this command !')
  }

  await cauldron.addNativeApp(napDescriptor, argv.platformVersion
    ? argv.platformVersion.toString().replace('v', '')
    : undefined)
}

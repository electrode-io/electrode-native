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

exports.handler = async function ({
  completeNapDescriptor,
  platformVersion
} : {
  completeNapDescriptor: string,
  platformVersion?: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  if (napDescriptor.isPartial) {
    return log.error('You need to provide a complete native application descriptor to this command !')
  }

  await cauldron.addNativeApp(napDescriptor, platformVersion
    ? platformVersion.toString().replace('v', '')
    : undefined)
}

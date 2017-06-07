// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'dependency <completeNapDescriptor> <dependency>'
exports.desc = 'Add a native dependency in the cauldron'

exports.builder = {}

exports.handler = async function (argv: any) {
  const napDescriptor = NativeApplicationDescriptor.fromString(argv.completeNapDescriptor)
  const dependency = Dependency.fromString(argv.dependency)

  if (napDescriptor.isPartial) {
    return log.error('You need to provide a complete native application descriptor to this command')
  }

  await cauldron.addNativeDependency(napDescriptor, dependency)
}

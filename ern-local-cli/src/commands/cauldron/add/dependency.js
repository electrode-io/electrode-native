// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'dependency <completeNapDescriptor> <dependency>'
exports.desc = 'Add a native dependency in the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor,
  dependency
}: {
  completeNapDescriptor: string,
  dependency: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  if (napDescriptor.isPartial) {
    return log.error('You need to provide a complete native application descriptor to this command')
  }

  await cauldron.addNativeDependency(napDescriptor, Dependency.fromString(dependency))
}

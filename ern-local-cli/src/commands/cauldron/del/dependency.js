// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import {
  cauldron
} from '@walmart/ern-core'

exports.command = 'dependency <completeNapDescriptor> <dependency>'
exports.desc = 'Remove a dependency from the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor,
  dependency
} : {
  completeNapDescriptor: string,
  dependency: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  await cauldron.removeNativeDependency(napDescriptor, Dependency.fromString(dependency))
}

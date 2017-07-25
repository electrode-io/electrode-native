// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'

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

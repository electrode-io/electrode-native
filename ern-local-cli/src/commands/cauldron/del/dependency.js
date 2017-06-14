// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'dependency <completeNapDescriptor> <dependencyName>'
exports.desc = 'Remove a dependency from the cauldron'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor,
  dependencyName
} : {
  completeNapDescriptor: string,
  dependencyName: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  await cauldron.removeNativeDependency(napDescriptor, dependencyName)
}

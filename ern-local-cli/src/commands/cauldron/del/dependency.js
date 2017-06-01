// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'dependency <completeNapDescriptor> <dependencyName>'
exports.desc = 'Remove a dependency from the cauldron'

exports.builder = {}

exports.handler = async function (argv: any) {
  const napDescriptor = NativeApplicationDescriptor.fromString(argv.completeNapDescriptor)
  await cauldron.removeNativeDependency(napDescriptor, argv.dependencyName)
}

// @flow

import {
  NativeApplicationDescriptor
} from '@walmart/ern-util'
import cauldron from '../../../lib/cauldron'

exports.command = 'dependencies <completeNapDescriptor>'
exports.desc = 'Get all the native dependencies of a given native application'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  const dependencies = await cauldron.getNativeDependencies(napDescriptor)
  for (const dependency of dependencies) {
    log.info(dependency.toString())
  }
}

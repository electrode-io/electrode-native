// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import Ensure from '../../../lib/Ensure'

exports.command = 'dependencies <completeNapDescriptor>'
exports.desc = 'Get all the native dependencies of a given native application'

exports.builder = {}

exports.handler = async function ({
  completeNapDescriptor
} : {
  completeNapDescriptor: string
}) {
  Ensure.isCompleteNapDescriptorString(completeNapDescriptor)
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  const dependencies = await cauldron.getNativeDependencies(napDescriptor)
  for (const dependency of dependencies) {
    log.info(dependency.toString())
  }
}

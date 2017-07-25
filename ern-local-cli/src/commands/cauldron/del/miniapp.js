// @flow

import {
    NativeApplicationDescriptor,
    Dependency
} from 'ern-util'
import {
  cauldron
} from 'ern-core'

exports.command = 'miniapp <completeNapDescriptor> <miniAppName>'
exports.desc = 'Remove a mini app from the cauldron'

exports.builder = {}

exports.handler = async function ({
completeNapDescriptor,
miniAppName
} : {
    completeNapDescriptor: string,
     miniAppName: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  await cauldron.removeMiniAppFromContainer(napDescriptor, Dependency.fromString(miniAppName))
}

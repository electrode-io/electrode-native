// @flow

import {
  cauldron,
  dependencyLookup
} from 'ern-core'
import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import _ from 'lodash'

exports.command = 'why <dependency> <completeNapDescriptor>'
exports.desc = 'Why is a given native dependency included in a native application version ?'

exports.builder = function (yargs: any) {
  return yargs
}

exports.handler = async function ({
  dependency,
  completeNapDescriptor
} : {
  dependency: string,
  completeNapDescriptor: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  const miniApps = await cauldron.getContainerMiniApps(napDescriptor)
  const miniAppsPaths = _.map(miniApps, m => m.path)
  const result = await dependencyLookup.getMiniAppsUsingNativeDependency(miniAppsPaths, Dependency.fromString(dependency))
  if (!result || result.length === 0) {
    log.info(`${dependency} dependency is not directly used by any MiniApps`)
  } else {
    log.info(`The following MiniApp(s) are using ${dependency} dependency :`)
    for (const miniApp of result) {
      log.info(`=> ${miniApp.name}`)
    }
  }
}

// @flow

import {
  utils as coreUtils,
  dependencyLookup
} from 'ern-core'
import {
  Dependency,
  NativeApplicationDescriptor,
  Utils
} from 'ern-util'
import _ from 'lodash'
import utils from '../lib/utils'

exports.command = 'why <dependency> <completeNapDescriptor>'
exports.desc = 'Why is a given native dependency included in a native application version ?'

exports.builder = function (yargs: any) {
  return yargs.epilog(utils.epilog(exports))
}

exports.handler = async function ({
  dependency,
  completeNapDescriptor
} : {
  dependency: string,
  completeNapDescriptor: string
}) {
  try {
    const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
    const cauldron = await coreUtils.getCauldronInstance()
    const miniApps = await cauldron.getContainerMiniApps(napDescriptor)
    const miniAppsPaths = _.map(miniApps, m => m.path)
    log.info(`This might take a while. The more MiniApps, the longer.`)
    const result = await dependencyLookup.getMiniAppsUsingNativeDependency(miniAppsPaths, Dependency.fromString(dependency))
    if (!result || result.length === 0) {
      log.info(`${dependency} dependency is not directly used by any MiniApps`)
    } else {
      log.info(`The following MiniApp(s) are using ${dependency} dependency :`)
      for (const miniApp of result) {
        log.info(`=> ${miniApp.name}`)
      }
    }
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

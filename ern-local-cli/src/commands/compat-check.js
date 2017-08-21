// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  compatibility,
  MiniApp
} from 'ern-core'
import utils from '../lib/utils'

exports.command = 'compat-check [miniapp]'
exports.desc = 'Run compatibility checks for one or more MiniApp(s) against a target native application version'

exports.builder = function (yargs: any) {
  return yargs
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application selector (target native application version for the push)'
    })
}

exports.handler = async function ({
  miniapp,
  descriptor,
  miniapps = []
} : {
  miniapp?: string,
  descriptor?: string,
  miniapps: Array<string>
} = {}) {
  if (!miniapp && miniapps.length === 0) {
    try {
      miniapps.push(MiniApp.fromCurrentPath().packageDescriptor)
    } catch (e) {
      return log.error(e.message)
    }
  } else if (miniapp && miniapps.length === 0) {
    miniapps.push(miniapp)
  }

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron()
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor
  })

  for (const miniappPath of miniapps) {
    const miniapp = await MiniApp.fromPackagePath(miniappPath)
    log.info(`=> ${miniapp.name}`)
    await compatibility.checkCompatibilityWithNativeApp(
    miniapp, napDescriptor.name, napDescriptor.platform, napDescriptor.version)
  }
}

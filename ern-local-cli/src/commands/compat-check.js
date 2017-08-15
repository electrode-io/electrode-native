// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import {
  compatibility,
  MiniApp
} from 'ern-core'

exports.command = 'compat-check <completeNapDescriptor>'
exports.desc = 'Run compatibility checks for one or more MiniApp(s) against a target native application version'

exports.builder = function (yargs: any) {
  return yargs
    .option('miniapps', {
      type: 'array',
      alias: 'm',
      describe: 'A list of one or more miniapps'
    })
}

exports.handler = async function ({
  completeNapDescriptor,
  miniapps
} : {
  completeNapDescriptor: boolean,
  miniapps?: Array<string>
} = {}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  if (!miniapps) {
    await compatibility.checkCompatibilityWithNativeApp(
      MiniApp.fromCurrentPath(), napDescriptor.name, napDescriptor.platform, napDescriptor.version)
  } else {
    for (const miniappPath of miniapps) {
      const miniapp = await MiniApp.fromPackagePath(miniappPath)
      log.info(`=> ${miniapp.name}`)
      await compatibility.checkCompatibilityWithNativeApp(
      miniapp, napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    }
  }
}

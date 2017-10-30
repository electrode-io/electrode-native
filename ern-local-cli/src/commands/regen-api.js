// @flow

import {
  ApiGen
} from 'ern-api-gen'
import {
  manifest
} from 'ern-core'
import {
  Dependency,
  Utils
} from 'ern-util'
import utils from '../lib/utils'

exports.command = 'regen-api'
exports.desc = 'Regenerates an existing api'

exports.builder = function (yargs: any) {
  return yargs
    .option('skipVersion', {
      alias: 's',
      describe: 'Do not update API version and do not publish'
    })
    .option('bridgeVersion', {
      alias: 'b',
      describe: 'Bridge version to use'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  skipVersion,
  bridgeVersion
} : {
  skipVersion: boolean,
  bridgeVersion: string
} = {}) {
  try {
    if (!bridgeVersion) {
      const bridgeDep = await manifest.getNativeDependency(Dependency.fromString('react-native-electrode-bridge'))
      if (!bridgeDep) {
        return log.error(`react-native-electrode-bridge not found in manifest. please provide explicit version`)
      }
      bridgeVersion = bridgeDep.version
    }

    await ApiGen.regenerateCode({bridgeVersion, skipVersion})
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

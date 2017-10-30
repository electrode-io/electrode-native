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
    .option('updatePlugin', {
      alias: 'u',
      describe: 'Update plugin version'
    })
    .option('bridgeVersion', {
      alias: 'b',
      describe: 'Bridge version to use'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  updatePlugin,
  bridgeVersion
} : {
  updatePlugin: boolean,
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

    return ApiGen.regenerateCode({bridgeVersion, updatePlugin})
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

// @flow

import {
  ApiGen
} from 'ern-api-gen'
import {
  Manifest
} from 'ern-core'
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
  if (!bridgeVersion) {
    const bridgeDep = await Manifest.getPlugin('@walmart/react-native-electrode-bridge')
    if (!bridgeDep) {
      return log.error(`@walmart/react-native-electrode-bridge not found in manifest. please provide explicit version`)
    }
    bridgeVersion = bridgeDep.version
  }

  return ApiGen.regenerateCode({bridgeVersion, updatePlugin})
}

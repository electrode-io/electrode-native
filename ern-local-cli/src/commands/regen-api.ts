import { ApiGen } from 'ern-api-gen'
import { manifest, PackagePath, utils as coreUtils, yarn } from 'ern-core'
import utils from '../lib/utils'
import { Argv } from 'yargs'

export const command = 'regen-api'
export const desc = 'Regenerates an existing api'

export const builder = (argv: Argv) => {
  return argv
    .option('skipVersion', {
      alias: 's',
      describe: 'Do not update API version and do not publish',
    })
    .option('bridgeVersion', {
      alias: 'b',
      describe: 'Bridge version to use',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  skipVersion,
  bridgeVersion,
}: {
  skipVersion: boolean
  bridgeVersion: string
}) => {
  const errorMessage =
    'Run command #yarn info react-native-electrode-bridge versions# to get the valid bridgeVersion'
  try {
    const electrodeBridgePkg = PackagePath.fromString(
      'react-native-electrode-bridge'
    )
    if (bridgeVersion) {
      const electrodeBridgePkgInfo = await yarn.info(electrodeBridgePkg, {
        field: 'versions',
        json: true,
      })
      if (
        electrodeBridgePkgInfo &&
        electrodeBridgePkgInfo.data &&
        !electrodeBridgePkgInfo.data.includes(bridgeVersion)
      ) {
        throw new Error(
          `bridgeVersion ${bridgeVersion} is not valid. ${errorMessage}`
        )
      }
    } else {
      const bridgeDep = await manifest.getNativeDependency(electrodeBridgePkg)
      if (!bridgeDep) {
        throw new Error(
          `react-native-electrode-bridge is not found in manifest. Specify explicit --bridgeVersion in the command.\n ${errorMessage}`
        )
      }
      if (!bridgeDep.version) {
        throw new Error(
          `react-native-electrode-bridge version not defined. Specify explicit --bridgeVersion in the command. \n ${errorMessage}`
        )
      }
      bridgeVersion = bridgeDep.version
    }
    await ApiGen.regenerateCode({ bridgeVersion, skipVersion })
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

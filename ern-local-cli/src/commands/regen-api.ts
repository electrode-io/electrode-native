import { ApiGen } from 'ern-api-gen';
import { manifest, PackagePath, yarn } from 'ern-core';
import { epilog, logErrorAndExitIfNotSatisfied, tryCatchWrap } from '../lib';
import { Argv } from 'yargs';

export const command = 'regen-api';
export const desc = 'Regenerates an existing api';

export const builder = (argv: Argv) => {
  return argv
    .option('bridgeVersion', {
      alias: 'b',
      describe: 'Bridge version to use',
    })
    .option('manifestId', {
      describe: 'Id of the Manifest entry to use',
      type: 'string',
    })
    .option('skipVersion', {
      alias: 's',
      describe: 'Do not update API version and do not publish',
    })
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  bridgeVersion,
  manifestId,
  skipVersion,
}: {
  bridgeVersion: string;
  manifestId?: string;
  skipVersion: boolean;
}) => {
  if (manifestId) {
    await logErrorAndExitIfNotSatisfied({
      manifestIdExists: {
        id: manifestId,
      },
    });
  }

  const errorMessage =
    'Run command #yarn info react-native-electrode-bridge versions# to get the valid bridgeVersion';

  const electrodeBridgePkg = PackagePath.fromString(
    'react-native-electrode-bridge',
  );
  if (bridgeVersion) {
    const electrodeBridgePkgVersions = await yarn.info(electrodeBridgePkg, {
      field: 'versions',
    });
    if (
      electrodeBridgePkgVersions &&
      !electrodeBridgePkgVersions.includes(bridgeVersion)
    ) {
      throw new Error(
        `bridgeVersion ${bridgeVersion} is not valid. ${errorMessage}`,
      );
    }
  } else {
    const bridgeDep = await manifest.getNativeDependency(electrodeBridgePkg, {
      manifestId,
    });
    if (!bridgeDep) {
      throw new Error(
        `react-native-electrode-bridge is not found in manifest. Specify explicit --bridgeVersion in the command.\n ${errorMessage}`,
      );
    }
    if (!bridgeDep.version) {
      throw new Error(
        `react-native-electrode-bridge version not defined. Specify explicit --bridgeVersion in the command. \n ${errorMessage}`,
      );
    }
    bridgeVersion = bridgeDep.version;
  }
  await ApiGen.regenerateCode({ bridgeVersion, skipVersion });
};

export const handler = tryCatchWrap(commandHandler);

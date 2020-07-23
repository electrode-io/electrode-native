import {
  AppVersionDescriptor,
  createTmpDir,
  kax,
  log,
  NativePlatform,
  PackagePath,
  Platform,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import {
  parseJsonFromStringOrFile,
  runCauldronCompositeGen,
  runCauldronContainerGen,
  runLocalCompositeGen,
  runLocalContainerGen,
} from 'ern-orchestrator';
import {
  askUserToChooseANapDescriptorFromCauldron,
  askUserToSelectAPlatform,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../lib';
import { Argv } from 'yargs';
import fs from 'fs-extra';
import untildify from 'untildify';

export const command = 'create-container';
export const desc = 'Create a Container locally';

export const builder = (argv: Argv) => {
  return argv
    .option('baseComposite', {
      describe: 'Base Composite',
      type: 'string',
    })
    .coerce('baseComposite', (d) => PackagePath.fromString(d))
    .option('compositeDir', {
      describe: 'Directory in which to generate the Composite',
      type: 'string',
    })
    .coerce('compositeDir', (p) => untildify(p))
    .option('descriptor', {
      alias: 'd',
      describe: 'Full native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', (d) => AppVersionDescriptor.fromString(d))
    .option('extra', {
      alias: 'e',
      describe:
        'Optional extra run configuration (json string or local/cauldron path to config file)',
      type: 'string',
    })
    .option('devJsBundle', {
      describe:
        'Generate a development JavaScript bundle rather than a production one',
      type: 'boolean',
    })
    .option('fromGitBranches', {
      describe:
        'Create Container based on MiniApps branches rather than current MiniApps SHAs',
      type: 'boolean',
    })
    .option('ignoreRnpmAssets', {
      describe: 'Ignore rnpm assets from the MiniApps',
      type: 'boolean',
    })
    .option('jsApiImpls', {
      describe: 'A list of one or more JS API implementation',
      type: 'array',
    })
    .coerce('jsApiImpls', (d) => d.map(PackagePath.fromString))
    .option('miniapps', {
      alias: 'm',
      describe: 'A list of one or more miniapps',
      type: 'array',
    })
    .coerce('miniapps', (d) => d.map(PackagePath.fromString))
    .option('platform', {
      alias: 'p',
      choices: ['android', 'ios', undefined],
      describe: 'The platform for which to generate the container',
      type: 'string',
    })
    .option('resetCache', {
      describe:
        'Indicates whether to reset the React Native cache prior to bundling',
      type: 'boolean',
    })
    .option('skipInstall', {
      default: !(process.platform === 'darwin'),
      describe:
        'Skip `yarn install` and `pod install` after generating the container (iOS RN>=0.61 only)',
      type: 'boolean',
    })
    .option('sourceMapOutput', {
      describe: 'Path to source map file to generate for this container bundle',
      type: 'string',
    })
    .coerce('sourceMapOutput', (p) => untildify(p))
    .option('outDir', {
      alias: 'out',
      describe: 'Directory to output the generated container to',
      type: 'string',
    })
    .coerce('outDir', (p) => untildify(p))
    .epilog(epilog(exports));
};

export const commandHandler = async ({
  baseComposite,
  compositeDir,
  descriptor,
  devJsBundle,
  extra,
  fromGitBranches,
  ignoreRnpmAssets,
  jsApiImpls,
  miniapps,
  outDir,
  platform,
  resetCache,
  skipInstall,
  sourceMapOutput,
}: {
  baseComposite?: PackagePath;
  compositeDir?: string;
  descriptor?: AppVersionDescriptor;
  devJsBundle?: boolean;
  extra?: string;
  fromGitBranches?: boolean;
  ignoreRnpmAssets?: boolean;
  jsApiImpls?: PackagePath[];
  miniapps?: PackagePath[];
  outDir?: string;
  platform?: NativePlatform;
  resetCache?: boolean;
  skipInstall?: boolean;
  sourceMapOutput?: string;
} = {}) => {
  if (outDir && (await fs.pathExists(outDir))) {
    if ((await fs.readdir(outDir)).length > 0) {
      throw new Error(
        `${outDir} directory exists and is not empty.
Output directory should either not exist (it will be created) or should be empty.`,
      );
    }
  }

  compositeDir = compositeDir || createTmpDir();

  const cauldron = await getActiveCauldron({ throwIfNoActiveCauldron: false });
  if (!cauldron && !miniapps) {
    throw new Error(
      "A Cauldron must be active, if you don't explicitly provide miniapps",
    );
  }

  let extraObj;
  try {
    extraObj = (extra && (await parseJsonFromStringOrFile(extra))) || {};
  } catch (e) {
    throw new Error('(--extra/-e option): Invalid input');
  }

  // Full native application selector was not provided.
  // Ask the user to select a completeNapDescriptor from a list
  // containing all the native applications versions in the cauldron
  // Not needed if miniapps are directly provided
  if (!descriptor && !miniapps) {
    descriptor = await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    });
  }

  if (descriptor) {
    await logErrorAndExitIfNotSatisfied({
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'You cannot create a container for a non-existing native application version.',
      },
    });
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      descriptor,
    );
    baseComposite =
      baseComposite ||
      (compositeGenConfig?.baseComposite &&
        PackagePath.fromString(compositeGenConfig.baseComposite));
  }

  if (!descriptor && miniapps) {
    platform = platform || (await askUserToSelectAPlatform());

    if (platform === 'ios') {
      extraObj.iosConfig = extraObj.iosConfig || {};
      extraObj.iosConfig.skipInstall =
        extraObj.iosConfig.skipInstall || skipInstall;
    }

    const composite = await kax.task('Generating Composite locally').run(
      runLocalCompositeGen(miniapps, {
        baseComposite,
        jsApiImpls,
        outDir: compositeDir,
      }),
    );

    outDir = outDir || Platform.getContainerGenOutDirectory(platform);
    await kax.task('Generating Container locally').run(
      runLocalContainerGen(platform, composite, {
        devJsBundle,
        extra: extraObj,
        ignoreRnpmAssets,
        outDir,
        resetCache,
        sourceMapOutput,
      }),
    );
  } else if (descriptor) {
    const composite = await kax.task('Generating Composite from Cauldron').run(
      runCauldronCompositeGen(descriptor, {
        baseComposite,
        favorGitBranches: !!fromGitBranches,
        outDir: compositeDir,
      }),
    );

    outDir =
      outDir || Platform.getContainerGenOutDirectory(descriptor.platform!);
    await kax.task('Generating Container from Cauldron').run(
      runCauldronContainerGen(descriptor, composite, {
        devJsBundle,
        outDir,
        resetCache,
        sourceMapOutput,
      }),
    );
  }
  log.info(
    `Container successfully generated in ${outDir}\nComposite generated in ${compositeDir}`,
  );
};

export const handler = tryCatchWrap(commandHandler);

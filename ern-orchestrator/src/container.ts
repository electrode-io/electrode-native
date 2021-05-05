import {
  bundleMiniApps,
  ContainerGenerator,
  ContainerGenResult,
} from 'ern-container-gen';
import { Composite } from 'ern-composite-gen';
import { AndroidGenerator } from 'ern-container-gen-android';
import { IosGenerator } from 'ern-container-gen-ios';
import {
  AppVersionDescriptor,
  BundlingResult,
  createTmpDir,
  kax,
  log,
  NativePlatform,
  PackagePath,
  Platform,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import * as constants from './constants';

// Run container generator locally, without relying on the Cauldron, given a list of miniapp packages
// The string used to represent a miniapp package can be anything supported by `yarn add` command
// For example, the following miniapp strings are all valid
// FROM NPM => react-native-miniapp@1.2.3
// FROM GIT => git@github.com:org/test-miniapp.git
// FROM FS  => file:/home/user/test-miniapp
export async function runLocalContainerGen(
  platform: NativePlatform,
  composite: Composite,
  {
    outDir = Platform.getContainerGenOutDirectory(platform),
    ignoreRnpmAssets = false,
    jsMainModuleName,
    extra,
    sourceMapOutput,
    devJsBundle,
    resetCache,
  }: {
    outDir?: string;
    ignoreRnpmAssets?: boolean;
    jsMainModuleName?: string;
    extra?: any;
    sourceMapOutput?: string;
    devJsBundle?: boolean;
    resetCache?: boolean;
  },
): Promise<ContainerGenResult> {
  try {
    const generator = getGeneratorForPlatform(platform);
    return kax.task('Generating Container').run(
      generator.generate({
        androidConfig: (extra && extra.androidConfig) || {},
        composite,
        devJsBundle,
        hooks: extra?.containerGenerator?.hooks ?? {},
        ignoreRnpmAssets,
        iosConfig: (extra && extra.iosConfig) || {},
        jsMainModuleName,
        outDir,
        plugins: [],
        resetCache,
        sourceMapOutput,
        targetPlatform: platform,
      }),
    );
  } catch (e) {
    log.error(`runLocalContainerGen failed: ${e}`);
    throw e;
  }
}

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronContainerGen(
  napDescriptor: AppVersionDescriptor,
  composite: Composite,
  {
    devJsBundle,
    jsMainModuleName,
    outDir,
    resetCache,
    sourceMapOutput,
  }: {
    devJsBundle?: boolean;
    jsMainModuleName?: string;
    outDir?: string;
    resetCache?: boolean;
    sourceMapOutput?: string;
  } = {},
): Promise<ContainerGenResult> {
  try {
    const cauldron = await getActiveCauldron();

    if (!napDescriptor.platform) {
      throw new Error(`${napDescriptor} does not specify a platform`);
    }

    const plugins = await composite.getInjectableNativeDependencies(
      napDescriptor.platform,
    );

    const platform = napDescriptor.platform;
    const containerGeneratorConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor,
    );

    const generator = getGeneratorForPlatform(platform);

    const containerGenResult = await kax
      .task(`Generating Container for ${napDescriptor.toString()}`)
      .run(
        generator.generate({
          androidConfig:
            containerGeneratorConfig && containerGeneratorConfig.androidConfig,
          composite,
          devJsBundle:
            devJsBundle === undefined
              ? containerGeneratorConfig && containerGeneratorConfig.devJsBundle
              : devJsBundle,
          hooks: containerGeneratorConfig?.hooks ?? {},
          ignoreRnpmAssets:
            containerGeneratorConfig &&
            containerGeneratorConfig.ignoreRnpmAssets,
          iosConfig: containerGeneratorConfig?.iosConfig,
          jsMainModuleName,
          outDir: outDir || Platform.getContainerGenOutDirectory(platform),
          plugins,
          resetCache: resetCache ?? containerGeneratorConfig?.resetCache,
          sourceMapOutput,
          targetPlatform: platform,
        }),
      );

    return containerGenResult;
  } catch (e) {
    log.error(`runCauldronContainerGen failed: ${e}`);
    throw e;
  }
}

export async function runCaudronBundleGen(
  napDescriptor: AppVersionDescriptor,
  {
    baseComposite,
    compositeDir,
    outDir,
    resetCache,
    resolutions,
  }: {
    baseComposite?: PackagePath;
    compositeDir?: string;
    outDir: string;
    resetCache?: boolean;
    resolutions?: { [pkg: string]: string };
  },
): Promise<BundlingResult> {
  try {
    const cauldron = await getActiveCauldron();
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      napDescriptor,
    );
    baseComposite =
      baseComposite ||
      (compositeGenConfig?.baseComposite &&
        PackagePath.fromString(compositeGenConfig.baseComposite));
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor);
    const jsApiImpls = await cauldron.getContainerJsApiImpls(napDescriptor);
    const containerGenConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor,
    );
    let pathToYarnLock;
    if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
      pathToYarnLock = await cauldron.getPathToYarnLock(
        napDescriptor,
        constants.CONTAINER_YARN_KEY,
      );
    } else {
      log.debug(
        'Bypassing yarn.lock usage as bypassYarnLock flag is set in Cauldron config',
      );
    }
    if (!napDescriptor.platform) {
      throw new Error(`${napDescriptor} does not specify a platform`);
    }

    return kax.task('Bundling MiniApps').run(
      bundleMiniApps(
        miniapps,
        compositeDir || createTmpDir(),
        outDir,
        napDescriptor.platform,
        {
          baseComposite,
          jsApiImplDependencies: jsApiImpls,
          pathToYarnLock: pathToYarnLock || undefined,
          resetCache,
          resolutions,
        },
      ),
    );
  } catch (e) {
    log.error(`runCauldronBundleGen failed: ${e}`);
    throw e;
  }
}

function getGeneratorForPlatform(platform: string): ContainerGenerator {
  switch (platform) {
    case 'android':
      return new AndroidGenerator();
    case 'ios':
      return new IosGenerator();
    default:
      throw new Error(`Unsupported platform : ${platform}`);
  }
}

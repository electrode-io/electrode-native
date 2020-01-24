import {
  bundleMiniApps,
  ContainerGenerator,
  ContainerGenResult,
} from 'ern-container-gen'
import { Composite } from 'ern-composite-gen'
import { AndroidGenerator } from 'ern-container-gen-android'
import { IosGenerator } from 'ern-container-gen-ios'
import {
  createTmpDir,
  PackagePath,
  Platform,
  log,
  NativePlatform,
  kax,
  BundlingResult,
  AppVersionDescriptor,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import _ from 'lodash'
import semver from 'semver'
import * as constants from './constants'

// Run container generator locally, without relying on the Cauldron, given a list of miniapp packages
// The string used to represent a miniapp package can be anything supported by `yarn add` command
// For example, the following miniapp strings are all valid
// FROM NPM => react-native-miniapp@1.2.3
// FROM GIT => git@github.com:username/MiniAppp.git
// FROM FS  => file:/Users/username/Code/MiniApp
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
  }: {
    outDir?: string
    ignoreRnpmAssets?: boolean
    jsMainModuleName?: string
    extra?: any
    sourceMapOutput?: string
    devJsBundle?: boolean
  }
): Promise<ContainerGenResult> {
  try {
    const generator = getGeneratorForPlatform(platform)
    const nativeDependencies = await composite.getInjectableNativeDependencies(
      platform
    )

    return kax.task('Generating Container').run(
      generator.generate({
        androidConfig: (extra && extra.androidConfig) || {},
        composite,
        devJsBundle,
        ignoreRnpmAssets,
        jsMainModuleName,
        outDir,
        plugins: nativeDependencies,
        targetPlatform: platform,
      })
    )
  } catch (e) {
    log.error(`runLocalContainerGen failed: ${e}`)
    throw e
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
    sourceMapOutput,
  }: {
    devJsBundle?: boolean
    jsMainModuleName?: string
    outDir?: string
    sourceMapOutput?: string
  } = {}
): Promise<ContainerGenResult> {
  try {
    const cauldron = await getActiveCauldron()

    if (!napDescriptor.platform) {
      throw new Error(`${napDescriptor} does not specify a platform`)
    }

    const plugins = await composite.getInjectableNativeDependencies(
      napDescriptor.platform
    )

    const platform = napDescriptor.platform
    const containerGeneratorConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor
    )

    const generator = getGeneratorForPlatform(platform)

    const containerGenResult = await kax
      .task(`Generating Container for ${napDescriptor.toString()}`)
      .run(
        generator.generate({
          androidConfig:
            containerGeneratorConfig && containerGeneratorConfig.androidConfig,
          composite,
          devJsBundle:
            devJsBundle === undefined
              ? containerGeneratorConfig.devJsBundle
              : devJsBundle,
          ignoreRnpmAssets:
            containerGeneratorConfig &&
            containerGeneratorConfig.ignoreRnpmAssets,
          jsMainModuleName,
          outDir: outDir || Platform.getContainerGenOutDirectory(platform),
          plugins,
          sourceMapOutput,
          targetPlatform: platform,
        })
      )

    return containerGenResult
  } catch (e) {
    log.error(`runCauldronContainerGen failed: ${e}`)
    throw e
  }
}

export async function runCaudronBundleGen(
  napDescriptor: AppVersionDescriptor,
  {
    baseComposite,
    compositeDir,
    outDir,
    resolutions,
  }: {
    baseComposite?: PackagePath
    compositeDir?: string
    outDir: string
    resolutions?: { [pkg: string]: string }
  }
): Promise<BundlingResult> {
  try {
    const cauldron = await getActiveCauldron()
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      napDescriptor
    )
    baseComposite =
      baseComposite || (compositeGenConfig && compositeGenConfig.baseComposite)
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor)
    const jsApiImpls = await cauldron.getContainerJsApiImpls(napDescriptor)
    const containerGenConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor
    )
    let pathToYarnLock
    if (!containerGenConfig || !containerGenConfig.bypassYarnLock) {
      pathToYarnLock = await cauldron.getPathToYarnLock(
        napDescriptor,
        constants.CONTAINER_YARN_KEY
      )
    } else {
      log.debug(
        'Bypassing yarn.lock usage as bypassYarnLock flag is set in Cauldron config'
      )
    }
    if (!napDescriptor.platform) {
      throw new Error(`${napDescriptor} does not specify a platform`)
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
          resolutions,
        }
      )
    )
  } catch (e) {
    log.error(`runCauldronBundleGen failed: ${e}`)
    throw e
  }
}

export function containsVersionMismatch(
  versions: string[],
  mismatchLevel: 'major' | 'minor' | 'patch'
): boolean {
  const minVersion = semver.minSatisfying(versions, '*')
  const maxVersion = semver.maxSatisfying(versions, '*')
  const majorMismatch = semver.major(maxVersion) !== semver.major(minVersion)
  const minorMismatch = semver.minor(maxVersion) !== semver.minor(minVersion)
  const patchMismatch = semver.patch(maxVersion) !== semver.patch(minVersion)
  return (
    majorMismatch ||
    (minorMismatch &&
      (mismatchLevel === 'minor' || mismatchLevel === 'patch')) ||
    (patchMismatch && mismatchLevel === 'patch')
  )
}

function getGeneratorForPlatform(platform: string): ContainerGenerator {
  switch (platform) {
    case 'android':
      return new AndroidGenerator()
    case 'ios':
      return new IosGenerator()
    default:
      throw new Error(`Unsupported platform : ${platform}`)
  }
}

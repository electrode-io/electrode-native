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
  NativeApplicationDescriptor,
  Platform,
  log,
  NativePlatform,
  kax,
  BundlingResult,
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
    extraNativeDependencies = [],
    ignoreRnpmAssets = false,
    extra,
  }: {
    outDir?: string
    extraNativeDependencies: PackagePath[]
    ignoreRnpmAssets?: boolean
    extra?: any
  }
) {
  try {
    const generator = getGeneratorForPlatform(platform)
    const nativeDependencies = await composite.getResolvedNativeDependencies()

    await kax.task('Generating Container').run(
      generator.generate({
        androidConfig: (extra && extra.androidConfig) || {},
        composite,
        ignoreRnpmAssets,
        outDir,
        plugins: [...nativeDependencies.resolved, ...extraNativeDependencies],
        pluginsDownloadDir: createTmpDir(),
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
  napDescriptor: NativeApplicationDescriptor,
  composite: Composite,
  {
    outDir,
  }: {
    outDir?: string
  } = {}
): Promise<ContainerGenResult> {
  try {
    const cauldron = await getActiveCauldron()
    const cauldronNativeDependencies = await cauldron.getNativeDependencies(
      napDescriptor
    )

    if (!napDescriptor.platform) {
      throw new Error(`${napDescriptor} does not specify a platform`)
    }

    const compositeNativeDeps = await composite.getResolvedNativeDependencies()

    // Final native dependencies are the one that are in Composite
    // plus any extra ones present in the Cauldron that are not
    // in the Composite
    const extraCauldronNativeDependencies = _.differenceBy(
      cauldronNativeDependencies,
      compositeNativeDeps.resolved,
      'basePath'
    )
    log.debug(
      `extraCauldronNativeDependencies: ${JSON.stringify(
        extraCauldronNativeDependencies,
        null,
        2
      )}`
    )
    const plugins = [
      ...extraCauldronNativeDependencies,
      ...compositeNativeDeps.resolved,
    ]

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
          ignoreRnpmAssets:
            containerGeneratorConfig &&
            containerGeneratorConfig.ignoreRnpmAssets,
          outDir: outDir || Platform.getContainerGenOutDirectory(platform),
          plugins,
          pluginsDownloadDir: createTmpDir(),
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
  napDescriptor: NativeApplicationDescriptor,
  {
    baseComposite,
    compositeDir,
    outDir,
  }: {
    baseComposite?: PackagePath
    compositeDir?: string
    outDir: string
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

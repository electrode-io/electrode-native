import { ContainerGenerator, ContainerGenResult } from 'ern-container-gen'
import { AndroidGenerator } from 'ern-container-gen-android'
import { IosGenerator } from 'ern-container-gen-ios'
import {
  createTmpDir,
  PackagePath,
  MiniApp,
  NativeApplicationDescriptor,
  Platform,
  log,
  NativePlatform,
  kax,
  nativeDepenciesVersionResolution,
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
  miniappPackagesPaths: PackagePath[],
  jsApiImplsPackagePaths: PackagePath[],
  platform: NativePlatform,
  {
    outDir = Platform.getContainerGenOutDirectory(platform),
    extraNativeDependencies = [],
    ignoreRnpmAssets = false,
  }: {
    outDir?: string
    extraNativeDependencies: PackagePath[]
    ignoreRnpmAssets?: boolean
  }
) {
  try {
    let apisAndNativeApisImpls: PackagePath[] = []
    let nativeModulesInManifest: PackagePath[] = []
    const miniapps: MiniApp[] = []

    for (const miniappPackagePath of miniappPackagesPaths) {
      log.debug(`Retrieving ${miniappPackagePath.toString()}`)

      let currentMiniApp
      if (miniappPackagePath.isFilePath) {
        currentMiniApp = MiniApp.fromPath(miniappPackagePath.basePath)
      } else {
        currentMiniApp = await MiniApp.fromPackagePath(miniappPackagePath)
      }

      miniapps.push(currentMiniApp)

      const nativeDependencies = await currentMiniApp.getNativeDependencies()

      const miniAppApisAndNativeApisImpls = [
        ...nativeDependencies.apis,
        ...nativeDependencies.nativeApisImpl,
      ]
      apisAndNativeApisImpls = apisAndNativeApisImpls.concat(
        miniAppApisAndNativeApisImpls
      )

      const miniAppNativeModulesInManifest =
        nativeDependencies.thirdPartyInManifest
      nativeModulesInManifest = nativeModulesInManifest.concat(
        miniAppNativeModulesInManifest
      )
    }

    // Move react-native-electrode-bridge from nativeModulesInManifest array to apisAndNativeApisImpls array
    // as when it comes to version compatibility checks, react-native-electrode-bridge should be considered
    // in the same way as APIs and APIs implementations (it's a native module exception)
    const bridgeDep = _.remove(
      nativeModulesInManifest,
      d => d.basePath === 'react-native-electrode-bridge'
    )
    apisAndNativeApisImpls = apisAndNativeApisImpls.concat(bridgeDep)

    const apiAndApiImplsResolvedVersions = nativeDepenciesVersionResolution.resolvePackageVersionsGivenMismatchLevel(
      apisAndNativeApisImpls,
      'major'
    )
    const nativeModulesResolvedVersions = nativeDepenciesVersionResolution.resolvePackageVersionsGivenMismatchLevel(
      nativeModulesInManifest,
      'patch'
    )

    if (
      apiAndApiImplsResolvedVersions.pluginsWithMismatchingVersions.length >
        0 ||
      nativeModulesResolvedVersions.pluginsWithMismatchingVersions.length > 0
    ) {
      throw new Error(`The following plugins are not using compatible versions : 
        ${apiAndApiImplsResolvedVersions.pluginsWithMismatchingVersions.toString()} 
        ${nativeModulesResolvedVersions.pluginsWithMismatchingVersions.toString()}`)
    }

    const generator = getGeneratorForPlatform(platform)

    await kax.task('Generating Container').run(
      generator.generate({
        compositeMiniAppDir: createTmpDir(),
        ignoreRnpmAssets,
        jsApiImpls: jsApiImplsPackagePaths,
        miniApps: miniapps,
        outDir,
        plugins: [
          ...apiAndApiImplsResolvedVersions.resolved,
          ...nativeModulesResolvedVersions.resolved,
          ...extraNativeDependencies,
        ],
        pluginsDownloadDir: createTmpDir(),
        targetPlatform: platform,
      })
    )
  } catch (e) {
    log.error(`runLocalContainerGen failed: ${e}`)
    throw e
  }
}

async function retrieveMiniApps(miniApps: PackagePath[]): Promise<MiniApp[]> {
  const taskMsg = 'Retrieving MiniApps'
  const retrieveMiniAppsTask = kax.task(taskMsg)
  try {
    const result: MiniApp[] = []
    for (const miniApp of miniApps) {
      retrieveMiniAppsTask.text = `${taskMsg} [${miniApp.basePath}]`
      result.push(await MiniApp.fromPackagePath(miniApp))
    }
    retrieveMiniAppsTask.succeed(taskMsg)
    return result
  } catch (e) {
    retrieveMiniAppsTask.fail()
    throw e
  }
}

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronContainerGen(
  napDescriptor: NativeApplicationDescriptor,
  {
    outDir,
    compositeMiniAppDir,
    forceFullGeneration,
  }: {
    outDir?: string
    compositeMiniAppDir?: string
    forceFullGeneration?: boolean
  } = {}
): Promise<ContainerGenResult> {
  try {
    const cauldron = await getActiveCauldron()
    const plugins = await cauldron.getNativeDependencies(napDescriptor)
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor)
    const jsApiImpls = await cauldron.getContainerJsApiImpls(napDescriptor)
    const pathToYarnLock = await cauldron.getPathToYarnLock(
      napDescriptor,
      constants.CONTAINER_YARN_KEY
    )

    if (!napDescriptor.platform) {
      throw new Error(
        `napDescriptor (${napDescriptor.toString()}) does not contain a platform`
      )
    }

    if (!compositeMiniAppDir) {
      compositeMiniAppDir = createTmpDir()
    }

    const platform = napDescriptor.platform
    const containerGeneratorConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor
    )

    const miniAppsInstances: MiniApp[] = await retrieveMiniApps(miniapps)

    const generator = getGeneratorForPlatform(platform)

    const containerGenResult = await kax
      .task(`Generating Container for ${napDescriptor.toString()}`)
      .run(
        generator.generate({
          compositeMiniAppDir,
          forceFullGeneration,
          ignoreRnpmAssets:
            containerGeneratorConfig &&
            containerGeneratorConfig.ignoreRnpmAssets,
          jsApiImpls,
          miniApps: miniAppsInstances,
          outDir: outDir || Platform.getContainerGenOutDirectory(platform),
          pathToYarnLock: pathToYarnLock || undefined,
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

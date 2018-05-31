import {
  generateMiniAppsComposite,
  IosGenerator,
  AndroidGenerator,
  ContainerGenerator,
} from 'ern-container-gen'
import {
  ContainerPublisherConfig,
  GithubPublisher,
  MavenPublisher,
  JcenterPublisher,
} from 'ern-container-publisher'
import {
  createTmpDir,
  CodePushSdk,
  PackagePath,
  config,
  MiniApp,
  NativeApplicationDescriptor,
  Platform,
  spin,
  reactnative,
  CodePushPackage,
  CodePushInitConfig,
  log,
  NativePlatform,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import * as compatibility from './compatibility'
import inquirer from 'inquirer'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import shell from 'shelljs'
import * as constants from './constants'
import semver from 'semver'

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

export function resolvePluginsVersions(
  plugins: PackagePath[],
  mismatchLevel: 'major' | 'minor' | 'patch'
): {
  resolved: PackagePath[]
  pluginsWithMismatchingVersions: string[]
} {
  const result: any = {
    pluginsWithMismatchingVersions: [],
    resolved: [],
  }

  const pluginsByBasePath = _.groupBy(
    _.unionBy(plugins, p => p.toString()),
    'basePath'
  )
  for (const basePath of Object.keys(pluginsByBasePath)) {
    const entry = pluginsByBasePath[basePath]
    const pluginVersions = _.map(entry, 'version')
    if (pluginVersions.length > 1) {
      // If there are multiple versions of the dependency being used across all MiniApps
      if (containsVersionMismatch(<string[]>pluginVersions, mismatchLevel)) {
        // If at least one of the versions major digit differs, deem incompatibility
        result.pluginsWithMismatchingVersions.push(basePath)
      } else {
        // No mismatchLevel version differences, just return the highest version
        result.resolved.push(
          _.find(
            entry,
            c =>
              c.basePath === basePath &&
              c.version === semver.maxSatisfying(<string[]>pluginVersions, '*')
          )
        )
      }
    } else {
      // Only one version is used across all MiniApps, just use this version
      result.resolved.push(entry[0])
    }
  }

  return result
}

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
    outDir = path.join(Platform.rootDirectory, 'containergen'),
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

    const apiAndApiImplsResolvedVersions = resolvePluginsVersions(
      apisAndNativeApisImpls,
      'major'
    )
    const nativeModulesResolvedVersions = resolvePluginsVersions(
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

    await spin(
      'Generating Container',
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

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronContainerGen(
  napDescriptor: NativeApplicationDescriptor,
  {
    outDir,
    compositeMiniAppDir,
  }: {
    outDir?: string
    compositeMiniAppDir?: string
  } = {}
) {
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

    const miniAppsInstances: MiniApp[] = []
    for (const miniapp of miniapps) {
      miniAppsInstances.push(await MiniApp.fromPackagePath(miniapp))
    }

    const generator = getGeneratorForPlatform(platform)

    return spin(
      `Creating Container for ${napDescriptor.toString()} from Cauldron`,
      generator.generate({
        compositeMiniAppDir,
        ignoreRnpmAssets:
          containerGeneratorConfig && containerGeneratorConfig.ignoreRnpmAssets,
        jsApiImpls,
        miniApps: miniAppsInstances,
        outDir:
          outDir ||
          path.join(Platform.rootDirectory, 'containergen', 'out', platform),
        pathToYarnLock: pathToYarnLock || undefined,
        plugins,
        pluginsDownloadDir: createTmpDir(),
        targetPlatform: platform,
      })
    )
  } catch (e) {
    log.error(`runCauldronContainerGen failed: ${e}`)
    throw e
  }
}

export async function performCodePushPatch(
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string,
  label: string,
  {
    isDisabled,
    isMandatory,
    rollout,
  }: {
    isDisabled?: boolean
    isMandatory?: boolean
    rollout?: number
  }
) {
  let cauldron
  try {
    cauldron = await getActiveCauldron()
    const codePushSdk = getCodePushSdk()
    await cauldron.beginTransaction()
    const appName = await getCodePushAppName(napDescriptor)
    await codePushSdk.patch(appName, deploymentName, label, {
      isDisabled,
      isMandatory,
      rollout,
    })
    await cauldron.updateCodePushEntry(napDescriptor, deploymentName, label, {
      isDisabled,
      isMandatory,
      rollout,
    })
    await cauldron.commitTransaction(
      `CodePush patched ${napDescriptor.toString()} ${deploymentName} ${label}`
    )
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`[performCodePushPatch] ${e}`)
    throw e
  }
}

export async function performCodePushPromote(
  sourceNapDescriptor: NativeApplicationDescriptor,
  targetNapDescriptors: NativeApplicationDescriptor[],
  sourceDeploymentName: string,
  targetDeploymentName: string,
  {
    force = false,
    mandatory,
    rollout,
    label,
    targetBinaryVersion,
  }: {
    force?: boolean
    mandatory?: boolean
    rollout?: number
    label?: string
    targetBinaryVersion?: string
  } = {}
) {
  let cauldron
  try {
    const codePushSdk = getCodePushSdk()
    cauldron = await getActiveCauldron()
    await cauldron.beginTransaction()
    const cauldronCommitMessage = [
      `CodePush release promotion of ${sourceNapDescriptor.toString()} ${sourceDeploymentName} to ${targetDeploymentName} of`,
    ]

    for (const targetNapDescriptor of targetNapDescriptors) {
      if (!targetNapDescriptor.version) {
        throw new Error(`Missing version in ${targetNapDescriptor.toString()}`)
      }

      const codePushEntrySource = await cauldron.getCodePushEntry(
        sourceNapDescriptor,
        sourceDeploymentName,
        { label }
      )
      if (!codePushEntrySource) {
        throw new Error(
          `No CodePush entry found in Cauldron matching [desc: ${sourceNapDescriptor.toString()} dep: ${sourceDeploymentName} label: ${label ||
            'latest'}`
        )
      }

      const miniApps = _.map(codePushEntrySource.miniapps, miniapp =>
        PackagePath.fromString(miniapp)
      )
      const jsApiImpls = _.map(codePushEntrySource.jsApiImpls, jsapiimpl =>
        PackagePath.fromString(jsapiimpl)
      )
      if (
        (!miniApps || miniApps.length === 0) &&
        (!jsApiImpls || jsApiImpls.length === 0)
      ) {
        log.error(
          `No MiniApps or JS API Implementations were found in source release [${sourceDeploymentName} for ${sourceNapDescriptor.toString()}] `
        )
        throw new Error(`Aborting CodePush promotion`)
      }

      const nativeDependenciesVersionAligned = await areMiniAppsNativeDependenciesAlignedWithTargetApplicationVersion(
        miniApps,
        targetNapDescriptor
      )

      if (!nativeDependenciesVersionAligned && force) {
        log.warn(
          'Native dependencies versions are not aligned but ignoring due to the use of force flag'
        )
      } else if (!nativeDependenciesVersionAligned && !force) {
        if (!(await askUserToForceCodePushPublication())) {
          return log.info('CodePush promotion aborted')
        }
      }

      const appName = await getCodePushAppName(sourceNapDescriptor)
      const appVersion =
        targetBinaryVersion ||
        (await getCodePushTargetVersionName(
          targetNapDescriptor,
          targetDeploymentName
        ))
      const result = await spin(
        `Promoting release to ${appVersion}`,
        codePushSdk.promote(
          appName,
          sourceDeploymentName,
          targetDeploymentName,
          {
            appVersion,
            isMandatory: mandatory,
            label,
            rollout,
          }
        )
      )

      const sourceYarnLockId = await cauldron.getYarnLockId(
        sourceNapDescriptor,
        sourceDeploymentName
      )
      if (!sourceYarnLockId) {
        log.error(
          `No yarn.lock was found in source deployment [${sourceDeploymentName} for ${sourceNapDescriptor.toString()}]`
        )
        log.error(`Skipping promotion to ${targetNapDescriptor.toString()}`)
        continue
      }
      await cauldron.updateYarnLockId(
        targetNapDescriptor,
        targetDeploymentName,
        sourceYarnLockId
      )

      await cauldron.addCodePushEntry(
        targetNapDescriptor,
        {
          appVersion: result.appVersion,
          deploymentName: targetDeploymentName,
          isMandatory: result.isMandatory,
          label: result.label,
          promotedFromLabel: codePushEntrySource.metadata.label,
          releaseMethod: result.releaseMethod,
          releasedBy: result.releasedBy,
          rollout: result.rollout,
          size: result.size,
        },
        miniApps,
        jsApiImpls || []
      )

      cauldronCommitMessage.push(`- ${targetNapDescriptor.toString()}`)
    }
    await spin(
      `Updating Cauldron`,
      cauldron.commitTransaction(cauldronCommitMessage)
    )
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`[performCodePushPromote] ${e}`)
    throw e
  }
}

export async function performCodePushOtaUpdate(
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string,
  miniApps: PackagePath[],
  jsApiImpls: PackagePath[],
  {
    force = false,
    codePushIsMandatoryRelease = false,
    codePushRolloutPercentage,
    pathToYarnLock,
    skipConfirmation = false,
    targetBinaryVersion,
  }: {
    force: boolean
    codePushIsMandatoryRelease?: boolean
    codePushRolloutPercentage?: number
    pathToYarnLock?: string
    skipConfirmation?: boolean
    targetBinaryVersion?: string
  }
) {
  let cauldron
  try {
    const codePushSdk = getCodePushSdk()
    cauldron = await getActiveCauldron()
    const plugins = await cauldron.getNativeDependencies(napDescriptor)
    await cauldron.beginTransaction()
    const codePushPlugin = _.find(
      plugins,
      p => p.basePath === 'react-native-code-push'
    )
    if (!codePushPlugin) {
      throw new Error('react-native-code-push plugin is not in native app !')
    }

    const tmpWorkingDir = createTmpDir()

    const miniAppsNativeDependenciesVersionAligned = await areMiniAppsNativeDependenciesAlignedWithTargetApplicationVersion(
      miniApps,
      napDescriptor
    )

    if (!miniAppsNativeDependenciesVersionAligned && force) {
      log.warn(
        'Native dependencies versions of MiniApps are not aligned but ignoring due to the use of force flag'
      )
    } else if (!miniAppsNativeDependenciesVersionAligned && !force) {
      if (!(await askUserToForceCodePushPublication())) {
        throw new Error('CodePush publication aborted')
      }
    }

    const latestCodePushedMiniApps = await cauldron.getCodePushMiniApps(
      napDescriptor,
      deploymentName
    )
    const latestCodePushedJsApiImpls = await cauldron.getCodePushJsApiImpls(
      napDescriptor,
      deploymentName
    )

    // We need to include, in this CodePush bundle, all the MiniApps and JS API implementations that were part
    // of the previous CodePush. We will override versions of the MiniApps and JS API implementations with
    // the one provided to this function, and keep other ones intact.
    // For example, if previous CodePush bundle was containing MiniAppOne@1.0.0 and
    // MiniAppTwo@1.0.0 and this method is called to CodePush MiniAppOne@2.0.0, then
    // the bundle we will push will container MiniAppOne@2.0.0 and MiniAppTwo@1.0.0.
    // If this the first ever CodePush bundle for this specific native application version
    // then the reference miniapp versions are the one from the container.
    let referenceMiniAppsToCodePush = latestCodePushedMiniApps
    if (
      !referenceMiniAppsToCodePush ||
      referenceMiniAppsToCodePush.length === 0
    ) {
      referenceMiniAppsToCodePush = await cauldron.getContainerMiniApps(
        napDescriptor
      )
    }

    let referenceJsApiImplsToCodePush = latestCodePushedJsApiImpls
    if (
      !referenceJsApiImplsToCodePush ||
      referenceJsApiImplsToCodePush.length === 0
    ) {
      referenceJsApiImplsToCodePush = await cauldron.getContainerJsApiImpls(
        napDescriptor
      )
    }

    const miniAppsToBeCodePushed = _.unionBy(
      miniApps,
      referenceMiniAppsToCodePush,
      x => x.basePath
    )

    const jsApiImplsToBeCodePushed = _.unionBy(
      jsApiImpls,
      referenceJsApiImplsToCodePush,
      x => x.basePath
    )

    // If force or skipFinalConfirmation was not provided as option, we ask user for confirmation before proceeding
    // with code-push publication
    const userConfirmedCodePushPublication =
      force ||
      skipConfirmation ||
      (await askUserToConfirmCodePushPublication(
        miniAppsToBeCodePushed,
        jsApiImplsToBeCodePushed
      ))

    if (!userConfirmedCodePushPublication) {
      return log.info('CodePush publication aborted')
    } else {
      log.info('Getting things ready for CodePush publication')
    }

    const pathsToMiniAppsToBeCodePushed = _.map(miniAppsToBeCodePushed, m =>
      PackagePath.fromString(m.toString())
    )
    const pathToJsApiImplsToBeCodePushed = _.map(jsApiImplsToBeCodePushed, j =>
      PackagePath.fromString(j.toString())
    )

    await spin(
      'Generating composite module',
      generateMiniAppsComposite(
        pathsToMiniAppsToBeCodePushed,
        tmpWorkingDir,
        { pathToYarnLock },
        pathToJsApiImplsToBeCodePushed
      )
    )

    const bundleOutputDirectory = path.join(tmpWorkingDir, 'bundleOut')
    shell.mkdir('-p', bundleOutputDirectory)
    const platform = napDescriptor.platform || ''
    const bundleOutputPath =
      platform === 'android'
        ? path.join(bundleOutputDirectory, 'index.android.bundle')
        : path.join(bundleOutputDirectory, 'MiniApp.jsbundle')

    await spin(
      'Generating composite bundle for miniapps',
      reactnative.bundle({
        assetsDest: bundleOutputDirectory,
        bundleOutput: bundleOutputPath,
        dev: false,
        entryFile: `index.${platform}.js`,
        platform,
      })
    )

    const appName = await getCodePushAppName(napDescriptor)

    const targetVersionName =
      targetBinaryVersion ||
      (await getCodePushTargetVersionName(napDescriptor, deploymentName))

    log.info(`Target Binary version : ${targetVersionName}`)

    const codePushResponse: CodePushPackage = await spin(
      'Releasing bundle through CodePush',
      codePushSdk.releaseReact(
        appName,
        deploymentName,
        bundleOutputDirectory,
        targetVersionName,
        {
          isMandatory: codePushIsMandatoryRelease,
          rollout: codePushRolloutPercentage,
        }
      )
    )

    await cauldron.addCodePushEntry(
      napDescriptor,
      {
        appVersion: codePushResponse.appVersion,
        deploymentName,
        isMandatory: codePushResponse.isMandatory,
        label: codePushResponse.label,
        releaseMethod: codePushResponse.releaseMethod,
        releasedBy: codePushResponse.releasedBy,
        rollout: codePushResponse.rollout,
        size: codePushResponse.size,
      },
      miniAppsToBeCodePushed,
      jsApiImplsToBeCodePushed
    )

    const pathToNewYarnLock = path.join(tmpWorkingDir, 'yarn.lock')
    await spin(
      `Adding yarn.lock to Cauldron`,
      cauldron.addOrUpdateYarnLock(
        napDescriptor,
        deploymentName,
        pathToNewYarnLock
      )
    )
    await cauldron.commitTransaction(
      `CodePush release for ${napDescriptor.toString()} ${deploymentName}`
    )
  } catch (e) {
    if (cauldron) {
      await cauldron.discardTransaction()
    }
    log.error(`performCodePushOtaUpdate {e}`)
    throw e
  }
}

async function areMiniAppsNativeDependenciesAlignedWithTargetApplicationVersion(
  miniApps: PackagePath[],
  targetDescriptor: NativeApplicationDescriptor
): Promise<boolean> {
  for (const miniApp of miniApps) {
    const miniAppInstance = await spin(
      `Checking native dependencies version alignment of ${miniApp.toString()} with ${targetDescriptor.toString()}`,
      MiniApp.fromPackagePath(new PackagePath(miniApp.toString()))
    )
    const report = await compatibility.checkCompatibilityWithNativeApp(
      miniAppInstance,
      targetDescriptor.name,
      targetDescriptor.platform || undefined,
      targetDescriptor.version || undefined
    )
    if (!report.isCompatible) {
      log.warn('At least one native dependency version is not aligned !')
      return false
    } else {
      log.info(
        `${miniApp.toString()} native dependencies versions are aligned with ${targetDescriptor.toString()}`
      )
    }
  }
  return true
}

export async function getCodePushTargetVersionName(
  napDescriptor: NativeApplicationDescriptor,
  deploymentName: string
) {
  if (!napDescriptor.version) {
    throw new Error(
      `Native application descriptor ${napDescriptor.toString()} does not contain a version !`
    )
  }
  let result = napDescriptor.version
  const cauldron = await getActiveCauldron()
  const codePushConfig = await cauldron.getCodePushConfig(
    napDescriptor.withoutVersion()
  )
  if (codePushConfig && codePushConfig.versionModifiers) {
    const versionModifier = _.find(
      codePushConfig.versionModifiers,
      m => m.deploymentName === deploymentName
    )
    if (versionModifier) {
      result = result.replace(/(.+)/, versionModifier.modifier)
    }
  }
  return result
}

async function getCodePushAppName(
  napDescriptor: NativeApplicationDescriptor
): Promise<string> {
  let result = napDescriptor.name
  const cauldron = await getActiveCauldron()
  const codePushConfig = await cauldron.getCodePushConfig(
    napDescriptor.withoutVersion()
  )
  if (codePushConfig && codePushConfig.appName) {
    result = codePushConfig.appName
  } else {
    result = `${napDescriptor.name}${
      napDescriptor.platform === 'ios' ? 'Ios' : 'Android'
    }`
  }
  return result
}

export function getCodePushInitConfig(): CodePushInitConfig {
  const codePushConfigFilePath = path.join(
    process.env.LOCALAPPDATA || process.env.HOME || '',
    '.code-push.config'
  )
  let codePushInitConfig: CodePushInitConfig
  if (fs.existsSync(codePushConfigFilePath)) {
    codePushInitConfig = JSON.parse(
      fs.readFileSync(codePushConfigFilePath, 'utf-8')
    )
  } else {
    codePushInitConfig = {
      accessKey: config.getValue('codePushAccessKey'),
      customHeaders: config.getValue('codePushCustomHeaders'),
      customServerUrl: config.getValue('codePushCustomServerUrl'),
      proxy: config.getValue('codePushproxy'),
    }
  }
  return codePushInitConfig
}

export function getCodePushSdk() {
  const codePushInitConfig = getCodePushInitConfig()
  if (!codePushInitConfig || !codePushInitConfig.accessKey) {
    throw new Error('Unable to get the CodePush config to use')
  }
  return new CodePushSdk(codePushInitConfig)
}

async function askUserToConfirmCodePushPublication(
  miniAppsToBeCodePushed: PackagePath[],
  jsApiImplsToBeCodePushed: PackagePath[]
): Promise<boolean> {
  if (miniAppsToBeCodePushed && miniAppsToBeCodePushed.length > 0) {
    log.info(
      `The following MiniApp versions will get shipped in this CodePush OTA update :`
    )
    miniAppsToBeCodePushed.forEach(m => log.info(m.toString()))
  }
  if (jsApiImplsToBeCodePushed && jsApiImplsToBeCodePushed.length > 0) {
    log.info(
      `The following JS API implementation versions will get shipped in this CodePush OTA update :`
    )
    jsApiImplsToBeCodePushed.forEach(m => log.info(m.toString()))
  }

  const { userCodePushPublicationConfirmation } = await inquirer.prompt(
    <inquirer.Question>{
      message: 'Do you want to continue with CodePush publication ?',
      name: 'userCodePushPublicationConfirmation',
      type: 'confirm',
    }
  )

  return userCodePushPublicationConfirmation
}

async function askUserToForceCodePushPublication(): Promise<boolean> {
  const { userCodePushForcePublication } = await inquirer.prompt(
    <inquirer.Question>{
      message:
        'At least one native dependency version is not properly aligned. Do you want to force CodePush anyway ?',
      name: 'userCodePushForcePublication',
      type: 'confirm',
    }
  )

  return userCodePushForcePublication
}

export async function askUserForCodePushDeploymentName(
  napDescriptor: NativeApplicationDescriptor,
  message?: string
): Promise<string> {
  const cauldron = await getActiveCauldron()
  const conf = await cauldron.getConfig(napDescriptor)
  const hasCodePushDeploymentsConfig =
    conf && conf.codePush && conf.codePush.deployments
  const choices = hasCodePushDeploymentsConfig
    ? conf && conf.codePush.deployments
    : undefined

  const { userSelectedDeploymentName } = await inquirer.prompt(
    <inquirer.Question>{
      choices,
      message: message || 'Deployment name',
      name: 'userSelectedDeploymentName',
      type: choices ? 'list' : 'input',
    }
  )

  return userSelectedDeploymentName
}

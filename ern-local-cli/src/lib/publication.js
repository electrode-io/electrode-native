// @flow

import {
  generateContainer,
  generateMiniAppsComposite,
  IosGenerator,
  AndroidGenerator
} from 'ern-container-gen'
import {
  cauldron,
  compatibility,
  MiniApp,
  Platform,
  ContainerGeneratorConfig,
  reactnative
} from 'ern-core'
import {
  config,
  CodePushSdk,
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'
import type {
  CodePushPackage
} from 'ern-util'

import inquirer from 'inquirer'
import _ from 'lodash'
import tmp from 'tmp'
import path from 'path'
import fs from 'fs'
import shell from 'shelljs'
import * as constants from './constants'

function createContainerGenerator (config: ContainerGeneratorConfig) {
  switch (config.platform) {
    case 'android':
      log.debug('Creating an AndroidGenerator')
      return new AndroidGenerator({containerGeneratorConfig: config})
    case 'ios':
      log.debug('Creating an IOSGenerator')
      return new IosGenerator(config)
    default:
      throw new Error(`No Container Generator exists for ${config.platform} platform`)
  }
}

// Run container generator locally, without relying on the Cauldron, given a list of miniapp packages
// The string used to represent a miniapp package can be anything supported by `yarn add` command
// For example, the following miniapp strings are all valid
// FROM NPM => react-native-miniapp@1.2.3
// FROM GIT => git@github.com:username/MiniAppp.git
// FROM FS  => file:/Users/username/Code/MiniApp
export async function runLocalContainerGen (
miniappPackagesPaths: Array<DependencyPath>,
platform: 'android' | 'ios', {
  containerVersion = '1.0.0',
  nativeAppName = 'local',
  publicationUrl,
  outDir = `${Platform.rootDirectory}/containergen`,
  extraNativeDependencies = []
}: {
  containerVersion?: string,
  nativeAppName?: string,
  publicationUrl?: string,
  outDir?: string,
  extraNativeDependencies: Array<Dependency>
} = {}) {
  try {
    const nativeDependenciesStrings: Set < string > = new Set()
    let miniapps: Array<MiniApp> = []
    let config

    if (publicationUrl) {
      config = platform === 'android' ? {
        publishers: [{
          name: 'maven',
          url: publicationUrl
        }]
      } : {
        publishers: [{name: 'github', url: publicationUrl}]}
    }
    let containerGeneratorConfig = new ContainerGeneratorConfig(platform, config)
    log.debug(`containerGeneratorConfig is generated: ${JSON.stringify(containerGeneratorConfig)}`)

    for (const miniappPackagePath of miniappPackagesPaths) {
      log.debug(`Retrieving ${miniappPackagePath.toString()}`)

      let currentMiniApp
      if (miniappPackagePath.isAFileSystemPath) {
        currentMiniApp = MiniApp.fromPath(miniappPackagePath.unprefixedPath)
      } else {
        currentMiniApp = await MiniApp.fromPackagePath(miniappPackagePath)
      }

      miniapps.push(currentMiniApp)

      currentMiniApp.nativeDependencies.forEach(d => nativeDependenciesStrings.add(d.toString()))
    }

    let nativeDependencies = _.map(Array.from(nativeDependenciesStrings), d => Dependency.fromString(d))
    nativeDependencies = nativeDependencies.concat(extraNativeDependencies)

    // Verify uniqueness of native dependencies (that all miniapps are using the same
    // native dependencies version). This is a requirement in order to generate a proper container
    const nativeDependenciesWithoutVersion: Array<string> = _.map(
      nativeDependencies, d => d.withoutVersion().toString())
    const duplicateNativeDependencies =
      _(nativeDependenciesWithoutVersion).groupBy().pickBy(x => x.length > 1).keys().value()
    if (duplicateNativeDependencies.length > 0) {
      throw new Error(`The following native dependencies are not using the same version: ${duplicateNativeDependencies}`)
    }

    await spin(
      platform === 'android'
      ? 'Creating local Container and publishing AAR to maven local'
      : 'Creating local Container'
      , generateContainer({
        containerVersion,
        nativeAppName,
        generator: createContainerGenerator(containerGeneratorConfig),
        plugins: nativeDependencies,
        miniapps,
        workingDirectory: outDir
      }))
  } catch (e) {
    log.error(`runLocalContainerGen failed: ${e}`)
    throw e
  }
}

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronContainerGen (
napDescriptor: NativeApplicationDescriptor,
version: string, {
  publish,
  outDir = `${Platform.rootDirectory}/containergen`,
  containerName
}: {
  publish?: boolean,
  outDir?: string,
  containerName?: string
} = {}) {
  try {
    const plugins = await cauldron.getNativeDependencies(napDescriptor)
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor)
    const pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor, constants.CONTAINER_YARN_KEY)

    // Retrieve generator configuration (which for now only contains publication URL config)
    // only if caller of this method wants to publish the generated container
    let config
    if (publish) {
      config = await cauldron.getConfig(napDescriptor)
      log.debug(`Cauldron config: ${config ? JSON.stringify(config.containerGenerator) : 'undefined'}`)
    } else {
      log.info('Container publication is disabled. Will generate the container locally.')
    }

    if (!napDescriptor.platform) {
      throw new Error(`napDescriptor (${napDescriptor.toString()}) does not contain a platform`)
    }

    let containerGeneratorConfig = new ContainerGeneratorConfig(napDescriptor.platform, config ? config.containerGenerator : undefined)
    log.debug(`containerGeneratorConfig is generated: ${JSON.stringify(containerGeneratorConfig)}`)

    const miniAppsInstances = []
    for (const miniapp of miniapps) {
      miniAppsInstances.push(await MiniApp.fromPackagePath(miniapp.path))
    }

    const paths = await spin(
      `Creating Container for ${napDescriptor.toString()} from Cauldron`,
      generateContainer({
        containerVersion: version,
        nativeAppName: containerName || napDescriptor.name,
        generator: createContainerGenerator(containerGeneratorConfig),
        plugins,
        miniapps: miniAppsInstances,
        workingDirectory: outDir,
        pathToYarnLock: pathToYarnLock || undefined
      }))

    // Only update yarn lock if container is getting published
    if (publish) {
      const pathToNewYarnLock = path.join(paths.compositeMiniApp, 'yarn.lock')
      await cauldron.addOrUpdateYarnLock(napDescriptor, constants.CONTAINER_YARN_KEY, pathToNewYarnLock)
    }
  } catch (e) {
    log.error(`runCauldronContainerGen failed: ${e}`)
    throw e
  }
}

export async function performCodePushOtaUpdate (
napDescriptor: NativeApplicationDescriptor,
miniApps: Array<Dependency>, {
  force = false,
  codePushAppName,
  codePushDeploymentName,
  codePushTargetVersionName,
  codePushIsMandatoryRelease = false,
  codePushRolloutPercentage = 100,
  pathToYarnLock,
  skipConfirmation = false
}: {
  force: boolean,
  codePushAppName: string,
  codePushDeploymentName: string,
  codePushTargetVersionName: string,
  codePushIsMandatoryRelease: boolean,
  codePushRolloutPercentage: number,
  pathToYarnLock?: string,
  skipConfirmation?: boolean
} = {}) {
  const codePushAccessKey = getCodePushAccessKey()
  if (!codePushAccessKey) {
    throw new Error('Unable to get the CodePush access key to use')
  }

  const plugins = await cauldron.getNativeDependencies(napDescriptor)
  const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push')
  if (!codePushPlugin) {
    throw new Error('react-native-code-push plugin is not in native app !')
  }

  const codePushSdk = new CodePushSdk(codePushAccessKey)
  const tmpWorkingDir = tmp.dirSync({ unsafeCleanup: true }).name

  let nativeDependenciesVersionAligned = true

  for (const miniApp of miniApps) {
    let miniAppInstance = await spin(`Checking native dependencies version alignment of ${miniApp.toString()} with ${napDescriptor.toString()}`,
      MiniApp.fromPackagePath(new DependencyPath(miniApp.toString())))
    let report = await compatibility.checkCompatibilityWithNativeApp(
          miniAppInstance,
          napDescriptor.name,
          napDescriptor.platform,
          napDescriptor.version)
    if (!report.isCompatible) {
      nativeDependenciesVersionAligned = false
      log.warn('At least one native dependency version is not aligned !')
    } else {
      log.info(`${miniApp.toString()} native dependencies versions are aligned with ${napDescriptor.toString()}`)
    }
  }

  if (!nativeDependenciesVersionAligned && force) {
    log.warn('Native dependencies versions are not aligned but ignoring due to the use of force flag')
  } else if (!nativeDependenciesVersionAligned && !force) {
    if (!await askUserToForceCodePushPublication()) {
      return log.info('CodePush publication aborted')
    }
  }

  const latestCodePushedMiniApps = await cauldron.getCodePushMiniApps(napDescriptor, codePushDeploymentName)

  // We need to include, in this CodePush bundle, all the MiniApps that were part
  // of the previous CodePush. We will override versions of the MiniApps with
  // the one provided to this function, and keep other ones intact.
  // For example, if previous CodePush bundle was containing MiniAppOne@1.0.0 and
  // MiniAppTwo@1.0.0 and this method is called to CodePush MiniAppOne@2.0.0, then
  // the bundle we will push will container MiniAppOne@2.0.0 and MiniAppTwo@1.0.0.
  // If this the first ever CodePush bundle for this specific native application version
  // then the reference miniapp versions are the one from the container.
  let referenceMiniAppsToCodePush = latestCodePushedMiniApps
  if (!referenceMiniAppsToCodePush || referenceMiniAppsToCodePush.length === 0) {
    referenceMiniAppsToCodePush = await cauldron.getContainerMiniApps(napDescriptor)
  }

  const miniAppsToBeCodePushed = _.unionBy(
    miniApps, referenceMiniAppsToCodePush, x => x.withoutVersion().toString())

  // If force or skipFinalConfirmation was not provided as option, we ask user for confirmation before proceeding
  // with code-push publication
  const userConfirmedCodePushPublication = force || skipConfirmation || await askUserToConfirmCodePushPublication(miniAppsToBeCodePushed)

  if (!userConfirmedCodePushPublication) {
    return log.info('CodePush publication aborted')
  } else {
    log.info('Getting things ready for CodePush publication')
  }

  const pathsToMiniAppsToBeCodePushed = _.map(miniAppsToBeCodePushed, m => DependencyPath.fromString(m.toString()))
  await spin('Generating composite bundle to be published through CodePush',
     generateMiniAppsComposite(pathsToMiniAppsToBeCodePushed, tmpWorkingDir, {pathToYarnLock}))

  const bundleOutputDirectory = path.join(tmpWorkingDir, 'bundleOut')
  shell.mkdir('-p', bundleOutputDirectory)
  const platform = napDescriptor.platform || ''
  const bundleOutputPath = platform === 'android'
    ? path.join(bundleOutputDirectory, 'index.android.bundle')
    : path.join(bundleOutputDirectory, 'MiniApp.jsbundle')

  await reactnative.bundle({
    entryFile: `index.${platform}.js`,
    dev: false,
    bundleOutput: bundleOutputPath,
    platform,
    assetsDest: bundleOutputDirectory
  })

  codePushDeploymentName = codePushDeploymentName || await askUserForCodePushDeploymentName(napDescriptor)
  codePushAppName = codePushAppName || await askUserForCodePushAppName()

  const codePushResponse: CodePushPackage = await codePushSdk.releaseReact(
    codePushAppName,
    codePushDeploymentName,
    bundleOutputPath,
    codePushTargetVersionName, {
      isMandatory: codePushIsMandatoryRelease,
      rollout: codePushRolloutPercentage
    })

  await cauldron.addCodePushEntry(
    napDescriptor, {
      deploymentName: codePushDeploymentName,
      isMandatory: codePushResponse.isMandatory,
      appVersion: codePushResponse.appVersion,
      size: codePushResponse.size,
      releaseMethod: codePushResponse.releaseMethod,
      label: codePushResponse.label,
      releasedBy: codePushResponse.releasedBy,
      rollout: codePushResponse.rollout
    },
    miniAppsToBeCodePushed)

  const pathToNewYarnLock = path.join(tmpWorkingDir, 'yarn.lock')
  await spin(`Adding yarn.lock to Cauldron`, cauldron.addOrUpdateYarnLock(napDescriptor, codePushDeploymentName, pathToNewYarnLock))
}

export function getCodePushAccessKey () {
  let codePushAccessKey = config.getValue('codePushAccessKey')
  if (!codePushAccessKey) {
    const codePushConfigFilePath = path.join(process.env.LOCALAPPDATA || process.env.HOME || '', '.code-push.config')
    if (fs.existsSync(codePushConfigFilePath)) {
      codePushAccessKey = JSON.parse(fs.readFileSync(codePushConfigFilePath, 'utf-8')).accessKey
    }
  }
  return codePushAccessKey
}

async function askUserToConfirmCodePushPublication (miniAppsToBeCodePushed: Array<Dependency>) : Promise<boolean> {
  log.info(`The following MiniApp versions will get shipped in this CodePush OTA update :`)
  miniAppsToBeCodePushed.forEach(m => log.info(m.toString()))

  const { userCodePushPublicationConfirmation } = await inquirer.prompt({
    type: 'confirm',
    name: 'userCodePushPublicationConfirmation',
    message: 'Do you want to continue with CodePush publication ?'
  })

  return userCodePushPublicationConfirmation
}

async function askUserToForceCodePushPublication () : Promise<boolean> {
  const { userCodePushForcePublication } = await inquirer.prompt({
    type: 'confirm',
    name: 'userCodePushForcePublication',
    message: 'At least one native dependency version is not properly aligned. Do you want to force CodePush anyway ?'
  })

  return userCodePushForcePublication
}

async function askUserForCodePushDeploymentName (napDescriptor: NativeApplicationDescriptor) : Promise<string> {
  const config = await cauldron.getConfig(napDescriptor)
  const hasCodePushDeploymentsConfig = config && config.codePush && config.codePush.deployments
  const choices = hasCodePushDeploymentsConfig ? config.codePush.deployments : undefined

  const { userSelectedDeploymentName } = await inquirer.prompt({
    type: choices ? 'list' : 'input',
    name: 'userSelectedDeploymentName',
    message: 'Deployment name',
    choices
  })

  return userSelectedDeploymentName
}

async function askUserForCodePushAppName (defaultAppName) : Promise<string> {
  const { userSelectedCodePushAppName } = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedCodePushAppName',
    message: 'Application name',
    default: defaultAppName
  })
  return userSelectedCodePushAppName
}

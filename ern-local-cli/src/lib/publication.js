// @flow

import {
  generateContainer,
  generateMiniAppsComposite,
  IosGenerator,
  AndroidGenerator
} from 'ern-container-gen'
import {
  cauldron,
  codepush,
  compatibility,
  MiniApp,
  Platform,
  yarn,
  ContainerGeneratorConfig
} from 'ern-core'
import {
  Dependency,
  DependencyPath,
  findNativeDependencies,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'

import inquirer from 'inquirer'
import _ from 'lodash'
import tmp from 'tmp'
import path from 'path'
import ora from 'ora'

function createContainerGenerator (config: ContainerGeneratorConfig) {
  switch (config.platform) {
    case 'android':
      log.debug('Creating an AndroidGenerator')
      return new AndroidGenerator({containerGeneratorConfig: config})
    case 'ios':
      log.debug('Creating an IOSGenerator')
      return new IosGenerator(config)
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
    let miniapps = []
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

    const spinner = ora('Preparing MiniApp(s) and running compatibility checks').start()

    for (const miniappPackagePath of miniappPackagesPaths) {
      log.debug(`Retrieving ${miniappPackagePath.toString()}`)

      // Create temporary directory and yarn add the miniapp from within it
      const tmpDirPath = tmp.dirSync({ unsafeCleanup: true }).name
      process.chdir(tmpDirPath)
      await yarn.add(miniappPackagePath)

      // Extract full name of miniapp package from the package.json resulting from yarn add command
      const packageJson = require(`${tmpDirPath}/package.json`)
      const miniappDependency = Dependency.fromString(_.keys(packageJson.dependencies)[0])

      miniapps.push({
        scope: miniappDependency.scope,
        name: miniappDependency.name,
        packagePath: miniappPackagePath
      })

      // Find all native dependencies of this miniapp in the node_modules folder
      // and remove the miniapp itself, wrongly considered as a native dependency
      let miniappNativeDependencies = findNativeDependencies(`${tmpDirPath}/node_modules`)
      _.remove(miniappNativeDependencies,
        d => (d.scope === miniappDependency.scope) && (d.name === miniappDependency.name))

      // Add all native dependencies as strings to the set of native dependencies
      // of all miniapps
      miniappNativeDependencies.forEach(d => nativeDependenciesStrings.add(d.toString()))
    }

    spinner.succeed()

    let nativeDependencies = _.map(Array.from(nativeDependenciesStrings), d => Dependency.fromString(d))
    nativeDependencies = nativeDependencies.concat(extraNativeDependencies)

    // Verify uniqueness of native dependencies (that all miniapps are using the same
    // native dependencies version). This is a requirement in order to generate a proper container
    const nativeDependenciesWithoutVersion: Array<string> = _.map(
      nativeDependencies, d => d.withoutVersion().toString())
    const duplicateNativeDependencies =
      _(nativeDependenciesWithoutVersion).groupBy().pickBy(x => x.length > 1).keys().value()
    if (duplicateNativeDependencies.length > 0) {
      spinner.fail()
      throw new Error(`The following native dependencies are not using the same version: ${duplicateNativeDependencies}`)
    }

    await spin(
      'Creating local Container and publishing AAR to maven local'
      , generateContainer({
        containerVersion,
        nativeAppName,
        platformPath: Platform.currentPlatformVersionPath,
        generator: createContainerGenerator(containerGeneratorConfig),
        plugins: nativeDependencies,
        miniapps,
        workingFolder: outDir
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
    const pathToYarnLock = await cauldron.getPathToYarnLock(napDescriptor)

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

    const paths = await spin(
      `Creating Container for ${napDescriptor.toString()} from Cauldron`,
      generateContainer({
        containerVersion: version,
        nativeAppName: containerName || napDescriptor.name,
        platformPath: Platform.currentPlatformVersionPath,
        generator: createContainerGenerator(containerGeneratorConfig),
        plugins,
        miniapps,
        workingFolder: outDir,
        pathToYarnLock: pathToYarnLock || undefined
      }))

    // Only update yarn lock if container is getting published
    if (publish) {
      const pathToNewYarnLock = path.join(paths.compositeMiniApp, 'yarn.lock')
      await cauldron.addOrUpdateYarnLock(napDescriptor, pathToNewYarnLock)
    }
  } catch (e) {
    log.error(`runCauldronContainerGen failed: ${e}`)
    throw e
  }
}

export async function performCodePushOtaUpdate (
napDescriptor: NativeApplicationDescriptor,
miniApps: Array<Dependency>, {
  force,
  codePushAppName,
  codePushDeploymentName,
  codePushPlatformName,
  codePushTargetVersionName,
  codePushIsMandatoryRelease,
  codePushRolloutPercentage,
  pathToYarnLock
}: {
  force: boolean,
  codePushAppName: string,
  codePushDeploymentName: string,
  codePushPlatformName: 'android' | 'ios',
  codePushTargetVersionName: string,
  codePushIsMandatoryRelease: boolean,
  codePushRolloutPercentage: string,
  pathToYarnLock?: string
} = {}) {
  const plugins = await cauldron.getNativeDependencies(napDescriptor)

  const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push')
  if (!codePushPlugin) {
    throw new Error('react-native-code-push plugin is not in native app !')
  }

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

  const workingFolder = `${Platform.rootDirectory}/CompositeOta`
  const codePushMiniapps : Array<Array<string>> = await cauldron.getCodePushMiniApps(napDescriptor)
  const latestCodePushedMiniApps : Array<Dependency> = _.map(codePushMiniapps.pop(), Dependency.fromString)

  // We need to include, in this CodePush bundle, all the MiniApps that were part
  // of the previous CodePush. We will override versions of the MiniApps with
  // the one provided to this function, and keep other ones intact.
  // For example, if previous CodePush bundle was containing MiniAppOne@1.0.0 and
  // MiniAppTwo@1.0.0 and this method is called to CodePush MiniAppOne@2.0.0, then
  // the bundle we will push will container MiniAppOne@2.0.0 and MiniAppTwo@1.0.0.
  // If this the first ever CodePush bundle for this specific native application version
  // then the reference miniapp versions are the one from the container.
  let referenceMiniAppsToCodePush : Array<Dependency> = latestCodePushedMiniApps
  if (!referenceMiniAppsToCodePush || referenceMiniAppsToCodePush.length === 0) {
    referenceMiniAppsToCodePush = await cauldron.getContainerMiniApps(napDescriptor)
  }

  const miniAppsToBeCodePushed = _.unionBy(
    miniApps, referenceMiniAppsToCodePush, x => x.withoutVersion().toString())

  // If force was not provided as option, we ask user for confirmation before proceeding
  // with code-push publication
  const userConfirmedCodePushPublication = force || await askUserToConfirmCodePushPublication(miniAppsToBeCodePushed)

  if (!userConfirmedCodePushPublication) {
    return log.info('CodePush publication aborted')
  } else {
    log.info('Getting things ready for CodePush publication')
  }

  const pathsToMiniAppsToBeCodePushed = _.map(miniAppsToBeCodePushed, m => DependencyPath.fromString(m.toString()))
  await spin('Generating composite bundle to be published through CodePush',
     generateMiniAppsComposite(pathsToMiniAppsToBeCodePushed, workingFolder, {pathToYarnLock}))

  process.chdir(workingFolder)

  codePushDeploymentName = codePushDeploymentName || await askUserForCodePushDeploymentName(napDescriptor)
  codePushAppName = codePushAppName || await askUserForCodePushAppName()
  codePushPlatformName = codePushPlatformName || await askUserForCodePushPlatformName(napDescriptor.platform)

  const codePushWasDone = await codepush.releaseReact(
    codePushAppName,
    codePushPlatformName, {
      targetBinaryVersion: codePushTargetVersionName,
      mandatory: codePushIsMandatoryRelease,
      deploymentName: codePushDeploymentName,
      rolloutPercentage: codePushRolloutPercentage,
      askForConfirmation: !force
    })

  if (codePushWasDone) {
    await cauldron.addCodePushMiniApps(napDescriptor, miniAppsToBeCodePushed)
    const pathToNewYarnLock = path.join(workingFolder, 'yarn.lock')
    await spin(`Adding yarn.lock to Cauldron`, cauldron.addOrUpdateYarnLock(napDescriptor, pathToNewYarnLock))
  }
}

async function askUserToConfirmCodePushPublication (miniAppsToBeCodePushed: Array<Dependency>) {
  log.info(`The following MiniApp versions will get shipped in this CodePush OTA update :`)
  miniAppsToBeCodePushed.forEach(m => log.info(m.toString()))

  const { userCodePushPublicationConfirmation } = await inquirer.prompt({
    type: 'confirm',
    name: 'userCodePushPublicationConfirmation',
    message: 'Do you want to continue with CodePush publication ?'
  })

  return userCodePushPublicationConfirmation
}

async function askUserToForceCodePushPublication () {
  const { userCodePushForcePublication } = await inquirer.prompt({
    type: 'confirm',
    name: 'userCodePushForcePublication',
    message: 'At least one native dependency version is not properly aligned. Do you want to force CodePush anyway ?'
  })

  return userCodePushForcePublication
}

async function askUserForCodePushDeploymentName (napDescriptor: NativeApplicationDescriptor) {
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

async function askUserForCodePushAppName (defaultAppName) {
  const { userSelectedCodePushAppName } = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedCodePushAppName',
    message: 'Application name',
    default: defaultAppName
  })
  return userSelectedCodePushAppName
}

async function askUserForCodePushPlatformName (defaultPlatformName) {
  const { userSelectedCodePushPlatformName }: { userSelectedCodePushPlatformName: 'android' | 'ios' } = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedCodePushPlatformName',
    message: 'Platform name',
    default: defaultPlatformName
  })
  return userSelectedCodePushPlatformName
}

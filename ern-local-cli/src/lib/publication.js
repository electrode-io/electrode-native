// @flow

import {
  generateContainer,
  generateMiniAppsComposite,
  GithubGenerator,
  MavenGenerator
} from '@walmart/ern-container-gen'
import {
  codePush,
  Dependency,
  findNativeDependencies,
  NativeApplicationDescriptor,
  Platform,
  yarn
} from '@walmart/ern-util'
import {
  checkCompatibilityWithNativeApp,
  getNativeAppCompatibilityReport
} from './compatibility.js'
import cauldron from './cauldron'
import MiniApp from './miniapp.js'
import inquirer from 'inquirer'
import _ from 'lodash'
import emoji from 'node-emoji'
import tmp from 'tmp'

function createContainerGenerator (platform, config) {
  if (config) {
    switch (config.name) {
      case 'maven':
        return new MavenGenerator({ mavenRepositoryUrl: config.mavenRepositoryUrl })
      case 'github':
        return new GithubGenerator({ targetRepoUrl: config.targetRepoUrl })
    }
  }

    // No generator configuration was provided
    // Create default generator for target native platform
  switch (platform) {
    case 'android':
      return new MavenGenerator()
    case 'ios':
      return new GithubGenerator()
  }
}

// Run container generator locally, without relying on the Cauldron, given a list of miniapp packages
// The string used to represent a miniapp package can be anything supported by `yarn add` command
// For example, the following miniapp strings are all valid
// FROM NPM => @walmart/react-native-cart@1.2.3
// FROM GIT => git@gecgithub01.walmart.com:react-native/Cart.git
// FROM FS  => file:/Users/blemair/Code/Cart
export async function runLocalContainerGen (
  miniappPackages: Array<string>,
  platform: 'android' | 'ios', {
    containerVersion = '1.0.0',
    nativeAppName = 'local',
    publicationUrl
  } : {
    containerVersion?: string,
    nativeAppName?: string,
    publicationUrl?: string
  } = {}) {
  try {
    const nativeDependencies: Set<string> = new Set()
    let miniapps = []
    let config

    if (publicationUrl) {
      config = platform === 'android'
        ? { name: 'maven', mavenRepositoryUrl: publicationUrl }
        : { name: 'github', targetRepoUrl: publicationUrl }
    }

    for (const miniappPackage of miniappPackages) {
      log.info(`Processing ${miniappPackage}`)

      // Create temporary directory and yarn add the miniapp from within it
      const tmpDirPath = tmp.dirSync({unsafeCleanup: true}).name
      process.chdir(tmpDirPath)
      await yarn.yarnAdd(miniappPackage)

      // Extract full name of miniapp package from the package.json resulting from yarn add command
      const packageJson = require(`${tmpDirPath}/package.json`)
      const miniappDependency = Dependency.fromString(_.keys(packageJson.dependencies)[0])

      miniapps.push({
        scope: miniappDependency.scope,
        name: miniappDependency.name,
        packagePath: miniappPackage
      })

      // Find all native dependencies of this miniapp in the node_modules folder
      // and remove the miniapp itself, wrongly considered as a native dependency
      let miniappNativeDependencies = findNativeDependencies(`${tmpDirPath}/node_modules`)
      _.remove(miniappNativeDependencies,
        d => (d.scope === miniappDependency.scope) && (d.name === miniappDependency.name))

      // Add all native dependencies as strings to the set of native dependencies
      // of all miniapps
      miniappNativeDependencies.forEach(d => nativeDependencies.add(d.toString()))
    }

    const nativeDependenciesArray = Array.from(nativeDependencies)

    // Verify uniqueness of native dependencies (that all miniapps are using the same
    // native dependencies version). This is a requirement in order to generate a proper container
    const nativeDependenciesWithoutVersion: Array<string> = _.map(
      nativeDependenciesArray, d => Dependency.fromString(d).withoutVersion().toString())
    const duplicateNativeDependencies =
      _(nativeDependenciesWithoutVersion).groupBy().pickBy(x => x.length > 1).keys().value()
    if (duplicateNativeDependencies.length > 0) {
      throw new Error(`The following native dependencies are not using the same version: ${duplicateNativeDependencies}`)
    }

    log.info(`Generating container`)
    await generateContainer({
      containerVersion,
      nativeAppName,
      platformPath: Platform.currentPlatformVersionPath,
      generator: createContainerGenerator(platform, config),
      plugins: _.map(nativeDependenciesArray, d => Dependency.fromString(d)),
      miniapps
    })
  } catch (e) {
    log.error(`runLocalContainerGen failed: ${e}`)
    throw e
  }
}

// Run container generator using the Cauldron, given a native application descriptor
export async function runCauldronContainerGen (
  napDescriptor: NativeApplicationDescriptor,
  version: string, {
    disablePublication
  } : {
    disablePublication?: boolean
  }= {}) {
  try {
    const plugins = await cauldron.getNativeDependencies(napDescriptor)
    const miniapps = await cauldron.getContainerMiniApps(napDescriptor, { convertToObjects: true })

    // Retrieve generator configuration (which for now only contains publication URL config)
    // only if caller of this method wants to publish the generated container
    let config
    if (disablePublication) {
      log.info('Container publication is disabled. Will generate the container locally.')
    } else {
      config = await cauldron.getConfig(napDescriptor)
    }

    await generateContainer({
      containerVersion: version,
      nativeAppName: napDescriptor.name,
      platformPath: Platform.currentPlatformVersionPath,
      generator: createContainerGenerator(napDescriptor.platform, config ? config.containerGenerator : undefined),
      plugins,
      miniapps
    })
  } catch (e) {
    log.error(`runCauldronContainerGen failed: ${e}`)
    throw e
  }
}

// This is the entry point for publication of a MiniApp either in a new generated
// container or as an OTA update through CodePush
export async function publishMiniApp ({
  force,
  napDescriptor,
  npmPublish = false,
  publishAsOtaUpdate = false,
  publishAsNewContainer = false,
  containerVersion,
  codePushAppName,
  codePushDeploymentName,
  codePushPlatformName,
  codePushTargetVersionName,
  codePushIsMandatoryRelease,
  codePushRolloutPercentage
} : {
  force: boolean,
  napDescriptor: NativeApplicationDescriptor,
  npmPublish: boolean,
  publishAsOtaUpdate: boolean,
  publishAsNewContainer: boolean,
  containerVersion: string,
  codePushAppName: string,
  codePushDeploymentName: string,
  codePushPlatformName: 'android' | 'ios',
  codePushTargetVersionName: string,
  codePushIsMandatoryRelease: boolean,
  codePushRolloutPercentage: string
} = {}) {
  if (npmPublish) {
    MiniApp.fromCurrentPath().publishToNpm()
  }

  let nativeAppsToPublish = []

  // A specific native application / platform / version was provided, check for compatibility
  if (napDescriptor) {
    const report = await checkCompatibilityWithNativeApp(napDescriptor.name, napDescriptor.platform, napDescriptor.version)
    if (!report.isCompatible) {
      throw new Error('Cannot publish MiniApp. Native Application is not compatible')
    }

    nativeAppsToPublish.push({napDescriptor, isReleased: report.isReleased})
  } else {
    const compatibilityReport = await getNativeAppCompatibilityReport()

    const compatibleVersionsChoices = _.map(compatibilityReport, entry => {
      if (entry.isCompatible) {
        if ((publishAsOtaUpdate && entry.isReleased) ||
                (publishAsNewContainer && !entry.isReleased) ||
                (!publishAsOtaUpdate && !publishAsNewContainer)) {
          const curNapDescriptor =
            new NativeApplicationDescriptor(entry.appName, entry.appPlatform, entry.appVersion)
          const value = {
            napDescriptor: curNapDescriptor,
            isReleased: entry.isReleased
          }
          const suffix = value.isReleased
                        ? `[OTA] ${emoji.get('rocket')}` : `[IN-APP]`
          const name = `${value.napDescriptor.toString()} ${suffix}`
          return {name, value}
        }
      }
    }).filter(e => e !== undefined)

    if (compatibleVersionsChoices.length === 0) {
      return log.error('No compatible native application versions have been found')
    }

    const {nativeApps} = await inquirer.prompt({
      type: 'checkbox',
      name: 'nativeApps',
      message: 'Select one or more compatible native application version(s)',
      choices: compatibleVersionsChoices
    })

    nativeAppsToPublish = nativeApps
  }

  for (const nativeApp of nativeAppsToPublish) {
    if (nativeApp.isReleased) {
      await publishOta(nativeApp.napDescriptor, {
        force,
        codePushAppName,
        codePushDeploymentName,
        codePushPlatformName,
        codePushTargetVersionName,
        codePushIsMandatoryRelease,
        codePushRolloutPercentage
      })
    } else {
      await publishInApp(nativeApp.napDescriptor, {
        force,
        containerVersion
      })
    }
  }
}

async function publishInApp (
  napDescriptor: NativeApplicationDescriptor,
  { containerVersion, force }) {
  try {
    await MiniApp.fromCurrentPath().addToNativeAppInCauldron(napDescriptor, force)

    if (!containerVersion) {
      containerVersion = await askUserForContainerVersion()
    }

    await runCauldronContainerGen(napDescriptor, containerVersion)
  } catch (e) {
    log.error(`[publishInApp] failed`)
  }
}

async function askUserForContainerVersion () {
  const {userSelectedContainerVersion} = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedContainerVersion',
    message: 'Version of generated container'
  })
  return userSelectedContainerVersion
}

export async function publishOta (
  napDescriptor: NativeApplicationDescriptor, {
  force,
  codePushAppName,
  codePushDeploymentName,
  codePushPlatformName,
  codePushTargetVersionName,
  codePushIsMandatoryRelease,
  codePushRolloutPercentage
} : {
  force: boolean,
  codePushAppName: string,
  codePushDeploymentName: string,
  codePushPlatformName: 'android' | 'ios',
  codePushTargetVersionName: string,
  codePushIsMandatoryRelease: boolean,
  codePushRolloutPercentage: string
} = {}) {
  try {
    const plugins = await cauldron.getNativeDependencies(napDescriptor)

    const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push')
    if (!codePushPlugin) {
      throw new Error('react-native-code-push plugin is not in native app !')
    }

    await MiniApp.fromCurrentPath().addToNativeAppInCauldron(napDescriptor, force)

    const workingFolder = `${Platform.rootDirectory}/CompositeOta`
    const miniapps = await cauldron.getOtaMiniApps(napDescriptor, { onlyKeepLatest: true })

    await generateMiniAppsComposite(miniapps, workingFolder)
    process.chdir(workingFolder)

    codePushDeploymentName = codePushDeploymentName || await askUserForCodePushDeploymentName(napDescriptor)
    codePushAppName = codePushAppName || await askUserForCodePushAppName()
    codePushPlatformName = codePushPlatformName || await askUserForCodePushPlatformName(napDescriptor.platform)

    await codePush.releaseReact(
          codePushAppName,
          codePushPlatformName, {
            targetBinaryVersion: codePushTargetVersionName,
            mandatory: codePushIsMandatoryRelease,
            deploymentName: codePushDeploymentName,
            rolloutPercentage: codePushRolloutPercentage
          })
  } catch (e) {
    log.error(`[publishOta] failed: ${e}`)
  }
}

async function askUserForCodePushDeploymentName (napDescriptor: NativeApplicationDescriptor) {
  const config = await cauldron.getConfig(napDescriptor)
  const hasCodePushDeploymentsConfig = config && config.codePush && config.codePush.deployments
  const choices = hasCodePushDeploymentsConfig ? config.codePush.deployments : undefined

  const {userSelectedDeploymentName} = await inquirer.prompt({
    type: choices ? 'list' : 'input',
    name: 'userSelectedDeploymentName',
    message: 'Deployment name',
    choices
  })

  return userSelectedDeploymentName
}

async function askUserForCodePushAppName (defaultAppName) {
  const {userSelectedCodePushAppName} = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedCodePushAppName',
    message: 'Application name',
    default: defaultAppName
  })
  return userSelectedCodePushAppName
}

async function askUserForCodePushPlatformName (defaultPlatformName) {
  const {userSelectedCodePushPlatformName} : {userSelectedCodePushPlatformName: 'android' | 'ios'} = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedCodePushPlatformName',
    message: 'Platform name',
    default: defaultPlatformName
  })
  return userSelectedCodePushPlatformName
}

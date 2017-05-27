// @flow

import {
  generateContainer,
  generateMiniAppsComposite,
  GithubGenerator,
  MavenGenerator
} from '@walmart/ern-container-gen'
import {
  codePush,
  explodeNapSelector as explodeNativeAppSelector,
  platform,
  required
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

const ERN_PATH = `${process.env['HOME']}/.ern`

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

export async function runContainerGen (
  nativeAppName: string,
  nativeAppPlatform: string,
  nativeAppVersion: string,
  version: string, {
    disablePublication
  } : {
    disablePublication: boolean
  }= {}) {
  try {
    const plugins = await cauldron.getNativeDependencies(nativeAppName, nativeAppPlatform, nativeAppVersion)
    const miniapps = await cauldron.getContainerMiniApps(nativeAppName, nativeAppPlatform, nativeAppVersion, { convertToObjects: true })

    // Retrieve generator configuration (which for now only contains publication URL config)
    // only if caller of this method wants to publish the generated container
    let config
    if (disablePublication) {
      log.info('Container publication is disabled. Will generate the container locally.')
    } else {
      config = await cauldron.getConfig(nativeAppName, nativeAppPlatform, nativeAppVersion)
    }

    await generateContainer({
      containerVersion: version,
      nativeAppName,
      platformPath: platform.currentPlatformVersionPath,
      generator: createContainerGenerator(nativeAppPlatform, config ? config.containerGenerator : undefined),
      plugins,
      miniapps
    })
  } catch (e) {
    log.error(e)
  }
}

// This is the entry point for publication of a MiniApp either in a new generated
// container or as an OTA update through CodePush
export async function publishMiniApp ({
  force,
  fullNapSelector,
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
  fullNapSelector: string,
  npmPublish: boolean,
  publishAsOtaUpdate: boolean,
  publishAsNewContainer: boolean,
  containerVersion: string,
  codePushAppName: string,
  codePushDeploymentName: string,
  codePushPlatformName: string,
  codePushTargetVersionName: string,
  codePushIsMandatoryRelease: boolean,
  codePushRolloutPercentage: string
} = {}) {
  if (npmPublish) {
    MiniApp.fromCurrentPath().publishToNpm()
  }

  let nativeAppsToPublish = []

  // A specific native application / platform / version was provided, check for compatibility
  if (fullNapSelector) {
    const explodedNapSelector = explodeNativeAppSelector(fullNapSelector)
    const report = await checkCompatibilityWithNativeApp(explodedNapSelector[0], explodedNapSelector[1], explodedNapSelector[2])
    if (!report.isCompatible) {
      throw new Error('Cannot publish MiniApp. Native Application is not compatible')
    }

    nativeAppsToPublish.push({fullNapSelector, isReleased: report.isReleased})
  } else {
    const compatibilityReport = await getNativeAppCompatibilityReport()

    const compatibleVersionsChoices = _.map(compatibilityReport, entry => {
      if (entry.isCompatible) {
        if ((publishAsOtaUpdate && entry.isReleased) ||
                (publishAsNewContainer && !entry.isReleased) ||
                (!publishAsOtaUpdate && !publishAsNewContainer)) {
          const value = {
            fullNapSelector: `${entry.appName}:${entry.appPlatform}:${entry.appVersion}`,
            isReleased: entry.isReleased
          }
          const suffix = value.isReleased
                        ? `[OTA] ${emoji.get('rocket')}` : `[IN-APP]`
          const name = `${value.fullNapSelector} ${suffix}`
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
      await publishOta(nativeApp.fullNapSelector, {
        force,
        codePushAppName,
        codePushDeploymentName,
        codePushPlatformName,
        codePushTargetVersionName,
        codePushIsMandatoryRelease,
        codePushRolloutPercentage
      })
    } else {
      await publishInApp(nativeApp.fullNapSelector, {
        force,
        containerVersion
      })
    }
  }
}

async function publishInApp (fullNapSelector, {containerVersion, force}) {
  try {
    await MiniApp.fromCurrentPath().addToNativeAppInCauldron(
            ...explodeNativeAppSelector(fullNapSelector), force)

    if (!containerVersion) {
      containerVersion = await askUserForContainerVersion()
    }

    await runContainerGen(
            ...explodeNativeAppSelector(fullNapSelector), containerVersion)
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
  fullNapSelector: string, {
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
  codePushPlatformName: string,
  codePushTargetVersionName: string,
  codePushIsMandatoryRelease: boolean,
  codePushRolloutPercentage: string
} = {}) {
  try {
    const explodedNapSelector = explodeNativeAppSelector(fullNapSelector)
    const applicationName = explodedNapSelector[0]
    const platformName = explodedNapSelector[1]

    const plugins = await cauldron.getNativeDependencies(...explodedNapSelector)

    const codePushPlugin = _.find(plugins, p => p.name === 'react-native-code-push')
    if (!codePushPlugin) {
      throw new Error('react-native-code-push plugin is not in native app !')
    }

    await MiniApp.fromCurrentPath().addToNativeAppInCauldron(...explodedNapSelector, force)

    const workingFolder = `${ERN_PATH}/CompositeOta`
    const miniapps = await cauldron.getOtaMiniApps(...explodedNapSelector, { onlyKeepLatest: true })

    await generateMiniAppsComposite(miniapps, workingFolder)
    process.chdir(workingFolder)

    codePushDeploymentName = codePushDeploymentName || await askUserForCodePushDeploymentName(fullNapSelector)
    codePushAppName = codePushAppName || await askUserForCodePushAppName(`${applicationName}-${platformName}`)
    codePushPlatformName = codePushPlatformName || await askUserForCodePushPlatformName(platformName)

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

async function askUserForCodePushDeploymentName (fullNapSelector) {
  const explodedNapSelector = explodeNativeAppSelector(fullNapSelector)
  const config = await cauldron.getConfig(...explodedNapSelector)
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
  const {userSelectedCodePushPlatformName} = await inquirer.prompt({
    type: 'input',
    name: 'userSelectedCodePushPlatformName',
    message: 'Platform name',
    default: defaultPlatformName
  })
  return userSelectedCodePushPlatformName
}

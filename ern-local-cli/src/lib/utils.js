// @flow

import {
  cauldron,
  MiniApp,
  Platform,
  reactnative
} from 'ern-core'
import {
  generateAndroidRunnerProject,
  generateIosRunnerProject,
  regenerateAndroidRunnerConfig,
  regenerateIosRunnerConfig
} from 'ern-runner-gen'
import {
  android,
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from './publication'
import {
  execSync
} from 'child_process'
import utils from './utils'
import shell from 'shelljs'
import _ from 'lodash'
import inquirer from 'inquirer'
import semver from 'semver'
import Ensure from './Ensure'
import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
const simctl = require('node-simctl')

const {
  runAndroid
} = android

//
// Retrieves all native applications versions from the Cauldron, optionaly
// filtered by platform/and or release status and returns them as an array
// of native application descriptor strings
async function getNapDescriptorStringsFromCauldron ({
  platform,
  onlyReleasedVersions,
  onlyNonReleasedVersions
} : {
  platform?: 'ios' | 'android',
  onlyReleasedVersions?: boolean,
  onlyNonReleasedVersions?: boolean
} = {}) {
  const nativeApps = await cauldron.getAllNativeApps()
  return _.filter(
            _.flattenDeep(
              _.map(nativeApps, nativeApp =>
                _.map(nativeApp.platforms, p =>
                _.map(p.versions, version => {
                  if (!platform || platform === p.name) {
                    if ((version.isReleased && !onlyNonReleasedVersions) ||
                       (!version.isReleased && !onlyReleasedVersions)) {
                      return `${nativeApp.name}:${p.name}:${version.name}`
                    }
                  }
                })))), elt => elt !== undefined)
}

//
// Ensure that some conditions are satisifed
// If not, log exception error message and exit process
async function logErrorAndExitIfNotSatisfied ({
  noGitOrFilesystemPath,
  isValidContainerVersion,
  isNewerContainerVersion,
  isCompleteNapDescriptorString,
  napDescriptorExistInCauldron,
  napDescritorDoesNotExistsInCauldron,
  publishedToNpm,
  miniAppNotInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
  dependencyNotInNativeApplicationVersionContainer,
  dependencyIsInNativeApplicationVersionContainer,
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion,
  dependencyNotInUseByAMiniApp
} : {
  noGitOrFilesystemPath?: {
    obj: string | Array<string>,
    extraErrorMessage?: string
  },
  isValidContainerVersion?: {
    containerVersion: string,
    extraErrorMessage?: string
  },
  isNewerContainerVersion?: {
    descriptor: string,
    containerVersion: string,
    extraErrorMessage?: string
  },
  isCompleteNapDescriptorString?: {
    descriptor: string,
    extraErrorMessage?: string
  },
  napDescriptorExistInCauldron?: {
    descriptor: string,
    extraErrorMessage?: string
  },
  napDescritorDoesNotExistsInCauldron?: {
    descriptor: string,
    extraErrorMessage?: string
  },
  publishedToNpm?: {
    obj: string | Array<string>,
    extraErrorMessage?: string
  },
  miniAppNotInNativeApplicationVersionContainer?: {
    miniApp: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  },
  miniAppIsInNativeApplicationVersionContainer?: {
    miniApp: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  },
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    miniApp: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  },
  dependencyNotInNativeApplicationVersionContainer?: {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  },
  dependencyIsInNativeApplicationVersionContainer?: {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  },
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  },
  dependencyNotInUseByAMiniApp? : {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor,
    extraErrorMessage?: string
  }
} = {}) {
  const spinner = ora('Performing initial checks').start()
  try {
    if (isValidContainerVersion) {
      spinner.text = 'Ensuring that container version is valid'
      Ensure.isValidContainerVersion(
        isValidContainerVersion.containerVersion,
        isValidContainerVersion.extraErrorMessage)
    }
    if (isNewerContainerVersion) {
      spinner.text = 'Ensuring that container version is newer compared to the current one'
      await Ensure.isNewerContainerVersion(
        isNewerContainerVersion.descriptor,
        isNewerContainerVersion.containerVersion,
        isNewerContainerVersion.extraErrorMessage)
    }
    if (isCompleteNapDescriptorString) {
      spinner.text = 'Ensuring that native application descriptor is complete'
      Ensure.isCompleteNapDescriptorString(
        isCompleteNapDescriptorString.descriptor,
        isCompleteNapDescriptorString.extraErrorMessage)
    }
    if (noGitOrFilesystemPath) {
      spinner.text = 'Ensuring that not git or file system path(s) is/are used'
      Ensure.noGitOrFilesystemPath(
        noGitOrFilesystemPath.obj,
        noGitOrFilesystemPath.extraErrorMessage)
    }
    if (napDescriptorExistInCauldron) {
      spinner.text = 'Ensuring that native application descriptor exists in Cauldron'
      await Ensure.napDescritorExistsInCauldron(
        napDescriptorExistInCauldron.descriptor,
        napDescriptorExistInCauldron.extraErrorMessage)
    }
    if (napDescritorDoesNotExistsInCauldron) {
      spinner.text = 'Ensuring that native application descriptor does not already exist in Cauldron'
      await Ensure.napDescritorDoesNotExistsInCauldron(
        napDescritorDoesNotExistsInCauldron.descriptor,
        napDescritorDoesNotExistsInCauldron.extraErrorMessage)
    }
    if (publishedToNpm) {
      spinner.text = 'Ensuring that package(s) version(s) have been published to NPM'
      await Ensure.publishedToNpm(
        publishedToNpm.obj,
        publishedToNpm.extraErrorMessage)
    }
    if (miniAppNotInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that MiniApp(s) is/are not present in native application version container'
      await Ensure.miniAppNotInNativeApplicationVersionContainer(
        miniAppNotInNativeApplicationVersionContainer.miniApp,
        miniAppNotInNativeApplicationVersionContainer.napDescriptor,
        miniAppNotInNativeApplicationVersionContainer.extraErrorMessage)
    }
    if (miniAppIsInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that MiniApp(s) is/are present in native application version container'
      await Ensure.miniAppIsInNativeApplicationVersionContainer(
        miniAppIsInNativeApplicationVersionContainer.miniApp,
        miniAppIsInNativeApplicationVersionContainer.napDescriptor,
        miniAppIsInNativeApplicationVersionContainer.extraErrorMessage)
    }
    if (miniAppIsInNativeApplicationVersionContainerWithDifferentVersion) {
      spinner.text = 'Ensuring that MiniApp(s) is/are present in native application version container with different version(s)'
      await Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.miniApp,
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.napDescriptor,
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.extraErrorMessage)
    }
    if (dependencyNotInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that dependency(ies) is/are not present in native application version container'
      await Ensure.dependencyNotInNativeApplicationVersionContainer(
        dependencyNotInNativeApplicationVersionContainer.dependency,
        dependencyNotInNativeApplicationVersionContainer.napDescriptor,
        dependencyNotInNativeApplicationVersionContainer.extraErrorMessage)
    }
    if (dependencyIsInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that dependency(ies) is/are present in native application version container'
      await Ensure.dependencyIsInNativeApplicationVersionContainer(
        dependencyIsInNativeApplicationVersionContainer.dependency,
        dependencyIsInNativeApplicationVersionContainer.napDescriptor,
        dependencyIsInNativeApplicationVersionContainer.extraErrorMessage)
    }
    if (dependencyIsInNativeApplicationVersionContainerWithDifferentVersion) {
      spinner.text = 'Ensuring that dependency(ies) is/are present in native application version container with different version(s)'
      await Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.dependency,
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.napDescriptor,
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.extraErrorMessage)
    }
    if (dependencyNotInUseByAMiniApp) {
      spinner.text = 'Ensuring that no MiniApp(s) is/are using a dependency'
      await Ensure.dependencyNotInUseByAMiniApp(
        dependencyNotInUseByAMiniApp.dependency,
        dependencyNotInUseByAMiniApp.napDescriptor,
        dependencyNotInUseByAMiniApp.extraErrorMessage)
    }
    spinner.succeed('All initial checks have passed')
  } catch (e) {
    spinner.fail(e.message)
    process.exit(1)
  }
}

//
// Inquire user to choose a native application version from the Cauldron, optionaly
// filtered by platform/and or release status and returns them as an array
// of native application descriptor strings
async function askUserToChooseANapDescriptorFromCauldron ({
  platform,
  onlyReleasedVersions,
  onlyNonReleasedVersions
} : {
  platform?: 'ios' | 'android',
  onlyReleasedVersions?: boolean,
  onlyNonReleasedVersions?: boolean
} = {}) : Promise<string> {
  const napDescriptorStrings = await getNapDescriptorStringsFromCauldron({
    platform,
    onlyReleasedVersions,
    onlyNonReleasedVersions
  })

  const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([{
    type: 'list',
    name: 'userSelectedCompleteNapDescriptor',
    message: 'Choose a native application version',
    choices: napDescriptorStrings
  }])

  return userSelectedCompleteNapDescriptor
}

//
// Perform some custom work on a container in Cauldron, provided as a
// function, that is going to change the state of the container,
// and regenerate a new container and publish it.
// If any part of this function fails, the Cauldron will not get updated
async function performContainerStateUpdateInCauldron (
  stateUpdateFunc: () => Promise<*>,
  napDescriptor: NativeApplicationDescriptor, {
  containerVersion
} : {
  containerVersion?: string
} = {}) {
  let cauldronContainerVersion
  if (containerVersion) {
    cauldronContainerVersion = containerVersion
  } else {
    cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(napDescriptor)
    cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
  }

  try {
    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    // Perform the custom container state update
    await stateUpdateFunc()

    // Run container generator
    await spin(`Generating new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`,
      runCauldronContainerGen(
        napDescriptor,
        cauldronContainerVersion,
        { publish: true }))

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await spin(`Updating Cauldron`, cauldron.commitTransaction())

    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`[performContainerStateUpdateInCauldron] An error happened ${e}`)
    cauldron.discardTransaction()
    throw e
  }
}

function epilog ({command} : {command: string}) {
  const rootUrl = 'https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-platform/blob/master/docs/cli'
  const commandWithoutOptions = command.split(' ')[0]
  const idx = _.indexOf(process.argv, commandWithoutOptions)
  let commandPath = _.slice(process.argv, 2, idx).join('/')
  commandPath = commandPath ? `/${commandPath}` : ''
  return `More info about this command @ ${chalk.bold(`${rootUrl}${commandPath}/${commandWithoutOptions}.md`)}`
}

async function runMiniApp (platform: 'android' | 'ios', {
  mainMiniAppName,
  miniapps,
  dependencies,
  descriptor,
  dev
} : {
  mainMiniAppName?: string,
  miniapps?: Array<string>,
  dependencies?: Array<string>,
  descriptor?: string,
  dev?: boolean
} = {}) {
  const cwd = process.cwd()

  let napDescriptor: ?NativeApplicationDescriptor

  if (miniapps && miniapps.length > 1 && !mainMiniAppName) {
    throw new Error(`If you provide multiple MiniApps you need to provide the name of the MiniApp to launch`)
  }

  if (miniapps && miniapps.length > 1 && dev) {
    throw new Error(`You cannot enable development mode yet when running multiple MiniApps`)
  }

  if (dependencies && (dependencies.length > 0) && descriptor) {
    throw new Error(`You cannot pass extra native dependencies when using a Native Application Descriptor`)
  }

  if (miniapps && descriptor) {
    throw new Error(`You cannot use miniapps and descriptor at the same time`)
  }

  if (descriptor) {
    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'You cannot create a Runner for a non existing native application version.'
      }
    })

    napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
  }

  let dependenciesObjs = []
  let miniAppsPaths = []
  if (miniapps) {
    if (MiniApp.existInPath(cwd)) {
      const miniapp = MiniApp.fromPath(cwd)
      miniAppsPaths = [ DependencyPath.fromFileSystemPath(cwd) ]
      log.info(`This command is being run from the ${miniapp.name} MiniApp directory.`)
      log.info(`All provided extra MiniApps will be included in the Runner container along with ${miniapp.name}`)
      if (!mainMiniAppName) {
        log.info(`${miniapp.name} MiniApp will be set as the main MiniApp. You can choose another one instead through 'mainMiniAppName' option`)
        mainMiniAppName = miniapp.name
      }
    }
    dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))
    miniAppsPaths = miniAppsPaths.concat(_.map(miniapps, m => DependencyPath.fromString(m)))
  } else if (!miniapps && !descriptor) {
    mainMiniAppName = MiniApp.fromCurrentPath().name
    log.info(`This command is being run from the ${mainMiniAppName} MiniApp directory.`)
    log.info(`Launching ${mainMiniAppName} standalone in the Runner.`)
    dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))
    miniAppsPaths = [ DependencyPath.fromFileSystemPath(cwd) ]
    if (dev === undefined) { // If dev is not defined it will default to true in the case of standalone MiniApp runner
      dev = true
      reactnative.startPackager(cwd)
    }
  }

  if (platform === 'android') {
    await generateContainerForRunner(platform, { napDescriptor, dependenciesObjs, miniAppsPaths })
    const pathToAndroidRunner = path.join(cwd, platform)
    if (!fs.existsSync(pathToAndroidRunner)) {
      shell.mkdir('-p', pathToAndroidRunner)
      await spin('Generating Android Runner project',
        generateAndroidRunnerProject(
          Platform.currentPlatformVersionPath,
          pathToAndroidRunner,
          mainMiniAppName,
          { reactNativeDevSupportEnabled: dev }))
    } else {
      await spin('Regenerating Android Runner Configuration',
        regenerateAndroidRunnerConfig(Platform.currentPlatformVersionPath,
          pathToAndroidRunner,
          mainMiniAppName,
          { reactNativeDevSupportEnabled: dev }))
    }
    await launchAndroidRunner(pathToAndroidRunner)
  } else if (platform === 'ios') {
    await generateContainerForRunner(platform, { napDescriptor, dependenciesObjs, miniAppsPaths })
    const pathToIosRunner = path.join(cwd, platform)
    if (!fs.existsSync(pathToIosRunner)) {
      shell.mkdir('-p', pathToIosRunner)
      await spin('Generating iOS Runner project',
      generateIosRunnerProject(
        Platform.currentPlatformVersionPath,
        pathToIosRunner,
        path.join(Platform.rootDirectory, 'containergen'),
        mainMiniAppName,
        { reactNativeDevSupportEnabled: dev }))
    } else {
      await spin('Regeneration iOS Runner Configuration',
        regenerateIosRunnerConfig(
          Platform.currentPlatformVersionPath,
          pathToIosRunner,
          path.join(Platform.rootDirectory, 'containergen'),
          mainMiniAppName,
          { reactNativeDevSupportEnabled: dev }))
    }
    await launchIosRunner(pathToIosRunner)
  } else {
    throw new Error(`Unsupported platform : ${platform}`)
  }
}

async function generateContainerForRunner (
  platform: 'android' | 'ios', {
    napDescriptor,
    dependenciesObjs = [],
    miniAppsPaths = []
  } : {
    napDescriptor?: NativeApplicationDescriptor,
    dependenciesObjs: Array<Dependency>,
    miniAppsPaths: Array<DependencyPath>
  } = {}) {
  if (napDescriptor) {
    await spin(`Generating runner Container based on ${napDescriptor.toString()}`,
    runCauldronContainerGen(
      napDescriptor,
      '1.0.0', {
        publish: false,
        containerName: 'runner'
      }))
  } else {
    await spin(`Gennerating runner Container with MiniApps`,
    runLocalContainerGen(
      miniAppsPaths,
      platform, {
        containerVersion: '1.0.0',
        nativeAppName: 'runner',
        extraNativeDependencies: dependenciesObjs
      }
    ))
  }
}

async function launchAndroidRunner (pathToAndroidRunner: string) {
  await runAndroid({
    projectPath: pathToAndroidRunner,
    packageName: 'com.walmartlabs.ern'
  })
}

async function launchIosRunner (pathToIosRunner: string) {
  const iosDevices = await simctl.getDevices()
  let iosDevicesChoices = _.filter(
                                  _.flattenDeep(
                                     _.map(iosDevices, (val, key) => val)
                                      ), (device) => device.name.match(/^iPhone/))
  const inquirerChoices = _.map(iosDevicesChoices, (val, key) => ({
    name: `${val.name} (UDID ${val.udid})`,
    value: val
  }))

  const answer = await inquirer.prompt([{
    type: 'list',
    name: 'device',
    message: 'Choose iOS simulator',
    choices: inquirerChoices
  }])

  try {
    execSync(`killall "Simulator" `)
  } catch (e) {
    // do nothing if there is no simulator launched
  }

  try {
    execSync(`xcrun instruments -w ${answer.device.udid}`)
  } catch (e) {
    // Apple will always throw some exception because we don't provide a -t.
    // but we just care about launching simulator with chosen UDID
  }

  const device = answer.device
  shell.cd(pathToIosRunner)

  const spinner = ora(`Compiling runner project`).start()

  try {
    execSync(`xcodebuild -scheme ErnRunner -destination 'platform=iOS Simulator,name=${device.name}' SYMROOT="${pathToIosRunner}/build" build`)
    spinner.text = 'Installing runner project on device'
    await simctl.installApp(device.udid, `${pathToIosRunner}/build/Debug-iphonesimulator/ErnRunner.app`)
    spinner.text = 'Launching runner project'
    await simctl.launch(device.udid, 'com.yourcompany.ernrunner')
    spinner.succeed('Done')
  } catch (e) {
    spinner.fail(e.message)
    throw e
  }
}

export default {
  getNapDescriptorStringsFromCauldron,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  performContainerStateUpdateInCauldron,
  epilog,
  runMiniApp
}

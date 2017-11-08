// @flow

import {
  cauldron,
  MiniApp,
  Platform,
  reactnative,
  yarn,
  ModuleTypes
} from 'ern-core'
import {
  generateRunnerProject,
  regenerateRunnerConfig
} from 'ern-runner-gen'
import {
  android,
  ios,
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor,
  spin,
  shell
} from 'ern-util'
import {
  runLocalContainerGen,
  runCauldronContainerGen
} from './publication'
import {
  spawn,
  spawnSync
} from 'child_process'
import utils from './utils'
import _ from 'lodash'
import inquirer from 'inquirer'
import semver from 'semver'
import Ensure from './Ensure'
import ora from 'ora'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
const {
  runAndroidProject
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
  dependencyNotInUseByAMiniApp,
  cauldronIsActive,
  isValidNpmPackageName,
  isValidElectrodeNativeModuleName
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
  },
  cauldronIsActive?: {
    extraErrorMessage?: string
  },
  isValidNpmPackageName?: {
    name: string,
    extraErrorMessage?: string
  },
  isValidElectrodeNativeModuleName?: {
    name: string,
    extraErrorMessage?: string
  }
} = {}) {
  const spinner = ora('Performing validity checks').start()
  try {
    if (cauldronIsActive) {
      spinner.text = 'Ensuring that a Cauldron is active'
      Ensure.cauldronIsActive(
        cauldronIsActive.extraErrorMessage
      )
    }
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
    if (isValidNpmPackageName) {
      spinner.text = 'Ensuring that NPM package name is valid'
      await Ensure.isValidNpmPackageName(
        isValidNpmPackageName.name,
        isValidNpmPackageName.extraErrorMessage)
    }
    if (isValidElectrodeNativeModuleName) {
      spinner.text = 'Ensuring that Electrode Native module name is valid'
      await Ensure.isValidElectrodeNativeModuleName(
        isValidElectrodeNativeModuleName.name,
        isValidElectrodeNativeModuleName.extraErrorMessage
      )
    }
    spinner.succeed('Validity checks have passed')
  } catch (e) {
    spinner.fail(e.message)
    process.exit(1)
  }
}

//
// Inquire user to choose a native application version from the Cauldron, optionally
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
  napDescriptor: NativeApplicationDescriptor,
  commitMessage: string | Array<string>, {
  containerVersion
} : {
  containerVersion?: string
} = {}) {
  let cauldronContainerVersion
  if (containerVersion) {
    cauldronContainerVersion = containerVersion
  } else {
    cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(napDescriptor)
    if (cauldronContainerVersion) {
      cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
    } else {
      // Default to 1.0.0 for Container version
      cauldronContainerVersion = '1.0.0'
    }
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
    await spin(`Updating Cauldron`, cauldron.commitTransaction(commitMessage))

    log.debug(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`[performContainerStateUpdateInCauldron] An error occurred: ${e}`)
    cauldron.discardTransaction()
    throw e
  }
}

function epilog ({command} : {command: string}) {
  const rootUrl = 'https://electrode.gitbooks.io/electrode-native/content/cli'
  const commandWithoutOptions = command.split(' ')[0]
  const idx = _.indexOf(process.argv, commandWithoutOptions)
  let commandPath = _.slice(process.argv, 2, idx).join('/')
  commandPath = commandPath ? `/${commandPath}` : ''
  return `More info about this command @ ${chalk.bold(`${rootUrl}${commandPath}/${commandWithoutOptions}.html`)}`
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

  let entryMiniAppName = mainMiniAppName || ''
  let dependenciesObjs = []
  let miniAppsPaths = []
  if (miniapps) {
    if (MiniApp.existInPath(cwd)) {
      const miniapp = MiniApp.fromPath(cwd)
      miniAppsPaths = [ DependencyPath.fromFileSystemPath(cwd) ]
      log.debug(`This command is being run from the ${miniapp.name} MiniApp directory.`)
      log.info(`All extra MiniApps will be included in the Runner container along with ${miniapp.name}`)
      if (!mainMiniAppName) {
        log.info(`${miniapp.name} will be set as the main MiniApp`)
        log.info(`You can select another one instead through '--mainMiniAppName' option`)
        entryMiniAppName = miniapp.name
      }
    }
    dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))
    miniAppsPaths = miniAppsPaths.concat(_.map(miniapps, m => DependencyPath.fromString(m)))
  } else if (!miniapps && !descriptor) {
    entryMiniAppName = MiniApp.fromCurrentPath().name
    log.debug(`This command is being run from the ${entryMiniAppName} MiniApp directory.`)
    log.debug(`Initializing Runner`)
    dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))
    miniAppsPaths = [ DependencyPath.fromFileSystemPath(cwd) ]
    if (dev === undefined) { // If dev is not defined it will default to true in the case of standalone MiniApp runner
      dev = true
      await reactnative.startPackagerInNewWindow(cwd)
    }
  }

  await generateContainerForRunner(platform, {
    napDescriptor: napDescriptor || undefined,
    dependenciesObjs,
    miniAppsPaths
  })

  const pathToRunner = path.join(cwd, platform)

  if (!fs.existsSync(pathToRunner)) {
    shell.mkdir('-p', pathToRunner)
    await spin(`Generating ${platform} Runner project`,
      generateRunnerProject(
        platform,
        pathToRunner,
        path.join(Platform.rootDirectory, 'containergen'),
        entryMiniAppName,
        { reactNativeDevSupportEnabled: dev }))
  } else {
    await spin(`Regenerating ${platform} Runner Configuration`,
      regenerateRunnerConfig(
        platform,
        pathToRunner,
        path.join(Platform.rootDirectory, 'containergen'),
        entryMiniAppName,
        { reactNativeDevSupportEnabled: dev }))
  }

  await launchRunner(platform, pathToRunner)
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
    await runCauldronContainerGen(
      napDescriptor,
      '1.0.0', {
        publish: false,
        containerName: 'runner'
      })
  } else {
    await spin('Generating Container locally', runLocalContainerGen(
      miniAppsPaths,
      platform, {
        containerVersion: '1.0.0',
        nativeAppName: 'runner',
        extraNativeDependencies: dependenciesObjs
      }))
  }
}

async function launchRunner (platform: string, pathToRunner: string) {
  if (platform === 'android') {
    return launchAndroidRunner(pathToRunner)
  } else if (platform === 'ios') {
    return launchIosRunner(pathToRunner)
  }
}

async function launchAndroidRunner (pathToAndroidRunner: string) {
  return runAndroidProject({
    projectPath: pathToAndroidRunner,
    packageName: 'com.walmartlabs.ern'
  })
}

async function launchIosRunner (pathToIosRunner: string) {
  const iosDevices = ios.getiPhoneRealDevices()
  if (iosDevices && iosDevices.length > 0) {
    launchOnDevice(pathToIosRunner, iosDevices)
  } else {
    launchOnSimulator(pathToIosRunner)
  }
}

async function launchOnDevice (pathToIosRunner: string, devices) {
  const iPhoneDevice = await ios.askUserToSelectAniPhoneDevice(devices)
  shell.cd(pathToIosRunner)
  const spinner = ora('Waiting for device to boot').start()
  try {
    spinner.text = 'Building iOS Runner project'
    await buildIosRunner(pathToIosRunner, iPhoneDevice.udid)
      .then(() => {
        const iosDeployInstallArgs = [
          '--bundle', `${pathToIosRunner}/build/Debug-iphoneos/ErnRunner.app`,
          '--id', iPhoneDevice.udid,
          '--justlaunch'
        ]
        log.info(`Start installing ErnRunner on ${iPhoneDevice.name}...`)
        const iosDeployOutput = spawnSync('ios-deploy', iosDeployInstallArgs, {encoding: 'utf8'})
        if (iosDeployOutput.error) {
          log.error('INSTALLATION FAILED')
          log.warn('Make sure you have done "npm install -g ios-deploy".')
        } else {
          spinner.succeed('Installed and Launched ErnRunner on device ')
        }
      })
  } catch (e) {
    spinner.fail(e.message)
    throw e
  }
}

async function launchOnSimulator (pathToIosRunner: string) {
  const iPhoneSim = await ios.askUserToSelectAniPhoneSimulator()
  await ios.killAllRunningSimulators()
  const spinner = ora(`Waiting for device to boot`).start()
  await ios.launchSimulator(iPhoneSim.udid)

  shell.cd(pathToIosRunner)

  try {
    spinner.text = 'Building iOS Runner project'
    await buildIosRunner(pathToIosRunner, iPhoneSim.udid)
    spinner.text = 'Installing runner project on simulator'
    await ios.installApplicationOnSimulator(iPhoneSim.udid, `${pathToIosRunner}/build/Debug-iphonesimulator/ErnRunner.app`)
    spinner.text = 'Launching runner project'
    await ios.launchApplication(iPhoneSim.udid, 'com.yourcompany.ernrunner')
    spinner.succeed('Done')
  } catch (e) {
    spinner.fail(e.message)
    throw e
  }
}

async function buildIosRunner (pathToIosRunner: string, udid: string) {
  return new Promise((resolve, reject) => {
    const xcodebuildProc = spawn('xcodebuild', [
      `-scheme`, 'ErnRunner', 'build',
      `-destination`, `id=${udid}`,
      `SYMROOT=${pathToIosRunner}/build` ],
       { cwd: pathToIosRunner })

    xcodebuildProc.stdout.on('data', data => {
      log.debug(data)
    })
    xcodebuildProc.stderr.on('data', data => {
      log.debug(data)
    })
    xcodebuildProc.on('close', code => {
      code === 0
        ? resolve()
        : reject(new Error(`XCode xcbuild command failed with exit code ${code}`))
    })
  })
}

async function doesPackageExistInNpm (packageName: string) : Promise<boolean> {
  try {
    const result = await yarn.info(DependencyPath.fromString(packageName), {field: 'versions', json: true})
    if (result && result.type === `inspect`) {
      return true
    }
  } catch (e) {
    // If the package name doesn't exist in the NPM registry, Do nothing
    // {"type":"error","data":"Received invalid response from npm."}
  }
  return false
}

async function performPkgNameConflictCheck (name: string) : Promise<boolean> {
  // check if the packageName exists
  let isPackageNameInNpm = await doesPackageExistInNpm(name)
  if (isPackageNameInNpm) {
    const {continueIfPkgNameExists} = await inquirer.prompt([{
      type: 'confirm',
      name: 'continueIfPkgNameExists',
      message: `The package with name ${name} is already published in NPM registry. Do you wish to continue?`,
      default: false
    }])
    return continueIfPkgNameExists
  }
  return true // If package name doesn't exist continue with command execution
}

function checkIfModuleNameContainsSuffix (moduleName: string, moduleType: string): boolean {
  if (moduleName) {
    switch (moduleType) {
      case ModuleTypes.MINIAPP:
        return moduleName.toUpperCase().indexOf('APP') > -1
      case ModuleTypes.API:
        return moduleName.toUpperCase().indexOf('API') > -1
      case ModuleTypes.JS_API_IMPL:
        return moduleName.toUpperCase().indexOf('IMPL') > -1
      case ModuleTypes.NATIVE_API_IMPL:
        return moduleName.toUpperCase().indexOf('IMPL') > -1
      default:
        return false
    }
  }
  return false
}

async function promptUserToUseSuffixModuleName (moduleName: string, moduleType: string): Promise<string> {
  let message = ''
  let suffixedModuleName = moduleName
  if (moduleName) {
    switch (moduleType) {
      case ModuleTypes.MINIAPP:
        suffixedModuleName = `${moduleName}MiniApp`
        message = `We recommend suffixing the name of ${moduleName} with App, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.API:
        suffixedModuleName = `${moduleName}Api`
        message = `We recommend suffixing the name of ${moduleName} with Api, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.JS_API_IMPL:
        suffixedModuleName = `${moduleName}ApiImpl`
        message = `We recommend suffixing the name of ${moduleName} with Impl, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.NATIVE_API_IMPL:
        suffixedModuleName = `${moduleName}ApiImpl`
        message = `We recommend suffixing the name of ${moduleName} with Impl, Do you want to use ${suffixedModuleName}?`
        break
      default:
        throw new Error(`Unsupported module type : ${moduleType}`)
    }
  }

  const {useSuffixedModuleName} = await inquirer.prompt(
    {
      type: 'confirm',
      name: 'useSuffixedModuleName',
      message: message,
      default: true
    }
  )

  return useSuffixedModuleName ? suffixedModuleName : moduleName
}

export default {
  getNapDescriptorStringsFromCauldron,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  performContainerStateUpdateInCauldron,
  epilog,
  runMiniApp,
  doesPackageExistInNpm,
  performPkgNameConflictCheck,
  checkIfModuleNameContainsSuffix,
  promptUserToUseSuffixModuleName
}

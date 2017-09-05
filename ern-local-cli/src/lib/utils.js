// @flow

import {
  cauldron,
  MiniApp
} from 'ern-core'
import {
  DependencyPath,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'
import {
  runCauldronContainerGen
} from './publication'
import _ from 'lodash'
import inquirer from 'inquirer'
import semver from 'semver'
import Ensure from './Ensure'
import ora from 'ora'
import chalk from 'chalk'

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
  miniapp,
  dev
} : {
  miniapp?: string,
  dev: boolean
} = {}) {
  const miniappObj = miniapp
    ? await MiniApp.fromPackagePath(DependencyPath.fromString(miniapp))
    : MiniApp.fromCurrentPath()

  if (platform === 'android') {
    return miniappObj.runInAndroidRunner({
      reactNativeDevSupportEnabled: dev
    })
  } else if (platform === 'ios') {
    return miniappObj.runInIosRunner({
      reactNativeDevSupportEnabled: dev
    })
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

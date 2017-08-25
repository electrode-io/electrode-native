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
  isCompleteNapDescriptorString,
  napDescriptorExistInCauldron,
  napDescritorDoesNotExistsInCauldron,
  publishedToNpm,
  miniAppNotInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainer,
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
  dependencyNotInNativeApplicationVersionContainer,
  dependencyIsInNativeApplicationVersionContainer,
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion
} : {
  noGitOrFilesystemPath?: string | Array<string>,
  isValidContainerVersion?: string,
  isCompleteNapDescriptorString?: string,
  napDescriptorExistInCauldron?: string,
  napDescritorDoesNotExistsInCauldron?: string,
  publishedToNpm?: string | Array<string>,
  miniAppNotInNativeApplicationVersionContainer?: {
    miniApp: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor
  },
  miniAppIsInNativeApplicationVersionContainer?: {
    miniApp: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor
  },
  miniAppIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    miniApp: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor
  },
  dependencyNotInNativeApplicationVersionContainer?: {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor
  },
  dependencyIsInNativeApplicationVersionContainer?: {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor
  },
  dependencyIsInNativeApplicationVersionContainerWithDifferentVersion?: {
    dependency: string | Array<string> | void,
    napDescriptor: NativeApplicationDescriptor
  }
} = {}) {
  const spinner = ora('Performing initial checks').start()
  try {
    if (isValidContainerVersion) {
      spinner.text = 'Ensuring that container version is valid'
      Ensure.isValidContainerVersion(isValidContainerVersion)
    }
    if (isCompleteNapDescriptorString) {
      spinner.text = 'Ensuring that native application descriptor is complete'
      Ensure.isCompleteNapDescriptorString(isCompleteNapDescriptorString)
    }
    if (noGitOrFilesystemPath) {
      spinner.text = 'Ensuring that not git or file system path(s) is/are used'
      Ensure.noGitOrFilesystemPath(noGitOrFilesystemPath)
    }
    if (napDescriptorExistInCauldron) {
      spinner.text = 'Ensuring that native application descriptor exists in Cauldron'
      await Ensure.napDescritorExistsInCauldron(napDescriptorExistInCauldron)
    }
    if (napDescritorDoesNotExistsInCauldron) {
      spinner.text = 'Ensuring that native application descriptor does not already exist in Cauldron'
      await Ensure.napDescritorDoesNotExistsInCauldron(napDescritorDoesNotExistsInCauldron)
    }
    if (publishedToNpm) {
      spinner.text = 'Ensuring that package(s) version(s) have been published to NPM'
      await Ensure.publishedToNpm(publishedToNpm)
    }
    if (miniAppNotInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that MiniApp(s) is/are not present in native application version container'
      await Ensure.miniAppNotInNativeApplicationVersionContainer(
        miniAppNotInNativeApplicationVersionContainer.miniApp,
        miniAppNotInNativeApplicationVersionContainer.napDescriptor)
    }
    if (miniAppIsInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that MiniApp(s) is/are present in native application version container'
      await Ensure.miniAppIsInNativeApplicationVersionContainer(
        miniAppIsInNativeApplicationVersionContainer.miniApp,
        miniAppIsInNativeApplicationVersionContainer.napDescriptor)
    }
    if (miniAppIsInNativeApplicationVersionContainerWithDifferentVersion) {
      spinner.text = 'Ensuring that MiniApp(s) is/are present in native application version container with different version(s)'
      await Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.miniApp,
        miniAppIsInNativeApplicationVersionContainerWithDifferentVersion.napDescriptor)
    }
    if (dependencyNotInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that dependency(ies) is/are not present in native application version container'
      await Ensure.dependencyNotInNativeApplicationVersionContainer(
        dependencyNotInNativeApplicationVersionContainer.dependency,
        dependencyNotInNativeApplicationVersionContainer.napDescriptor)
    }
    if (dependencyIsInNativeApplicationVersionContainer) {
      spinner.text = 'Ensuring that dependency(ies) is/are present in native application version container'
      await Ensure.dependencyIsInNativeApplicationVersionContainer(
        dependencyIsInNativeApplicationVersionContainer.dependency,
        dependencyIsInNativeApplicationVersionContainer.napDescriptor)
    }
    if (dependencyIsInNativeApplicationVersionContainerWithDifferentVersion) {
      spinner.text = 'Ensuring that dependency(ies) is/are present in native application version container with different version(s)'
      await Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.dependency,
        dependencyIsInNativeApplicationVersionContainerWithDifferentVersion.napDescriptor)
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
    cauldronContainerVersion = await cauldron.getContainerVersion(napDescriptor)
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
  miniapp
} : {
  miniapp?: string
}) {
  const miniappObj = miniapp
    ? await MiniApp.fromPackagePath(DependencyPath.fromString(miniapp))
    : MiniApp.fromCurrentPath()

  if (platform === 'android') {
    return miniappObj.runInAndroidRunner()
  } else if (platform === 'ios') {
    return miniappObj.runInIosRunner()
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

// @flow

import {
  cauldron
} from 'ern-core'
import _ from 'lodash'
import inquirer from 'inquirer'
import Ensure from './Ensure'

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
  napDescriptorExistInCauldron
} : {
  noGitOrFilesystemPath?: string | Array<string>,
  isValidContainerVersion?: string,
  isCompleteNapDescriptorString?: string,
  napDescriptorExistInCauldron?: string
} = {}) {
  try {
    if (isValidContainerVersion) {
      Ensure.isValidContainerVersion(isValidContainerVersion)
    }
    if (isCompleteNapDescriptorString) {
      Ensure.isCompleteNapDescriptorString(isCompleteNapDescriptorString)
    }
    if (noGitOrFilesystemPath) {
      Ensure.noGitOrFilesystemPath(noGitOrFilesystemPath)
    }
    if (napDescriptorExistInCauldron) {
      await Ensure.napDescritorExistsInCauldron(napDescriptorExistInCauldron)
    }
  } catch (e) {
    log.error(e.message)
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

export default {
  getNapDescriptorStringsFromCauldron,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron
}

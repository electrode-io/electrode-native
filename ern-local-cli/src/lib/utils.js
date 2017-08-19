// @flow

import {
  cauldron
} from 'ern-core'
import _ from 'lodash'
import Ensure from './Ensure'

async function getNapDescriptorStringsFromCauldron ({
  platform,
  onlyReleasedVersions
} : {
  platform?: 'ios' | 'android',
  onlyReleasedVersions?: boolean
} = {}) {
  const nativeApps = await cauldron.getAllNativeApps()
  return _.filter(
            _.flattenDeep(
              _.map(nativeApps, nativeApp =>
                _.map(nativeApp.platforms, p =>
                _.map(p.versions, version => {
                  if (!platform || platform === p.name) {
                    if (!onlyReleasedVersions || version.isReleased) {
                      return `${nativeApp.name}:${p.name}:${version.name}`
                    }
                  }
                })))), elt => elt !== undefined)
}

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

export default {
  getNapDescriptorStringsFromCauldron,
  logErrorAndExitIfNotSatisfied
}

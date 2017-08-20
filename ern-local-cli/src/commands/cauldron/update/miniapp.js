// @flow

import {
  MiniApp
} from 'ern-core'
import {
  DependencyPath,
  NativeApplicationDescriptor,
  spin
} from 'ern-util'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'miniapp [miniapp]'
exports.desc = 'Update version(s) of one or more MiniApp(s) in the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force'
  })
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
  })
  .option('miniapps', {
    type: 'array',
    alias: 'm',
    describe: 'A list of one or more miniapps'
  })
  .option('descriptor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
}

// Most/All of the logic here should be moved to the MiniApp class
// Commands should remain as much logic less as possible
exports.handler = async function ({
  miniapp,
  miniapps,
  descriptor,
  force = false,
  containerVersion
} : {
  miniapp?: string,
  miniapps?: Array<string>,
  descriptor: string,
  force: boolean,
  containerVersion?: string
}) {
  if (!miniapp && !miniapps) {
    miniapp = MiniApp.fromCurrentPath().packageDescriptor
  }

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: miniapps,
    publishedToNpm: miniapp || miniapps,
    miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: { miniApp: miniapp || miniapps, napDescriptor }
  })

  //
  // Construct MiniApp objects array
  let miniAppsObjs = []
  if (miniapps) {
    const miniAppsDependencyPaths = _.map(miniapps, m => DependencyPath.fromString(m))
    for (const miniAppDependencyPath of miniAppsDependencyPaths) {
      const m = await spin(`Retrieving ${miniAppDependencyPath} MiniApp`,
         MiniApp.fromPackagePath(miniAppDependencyPath))
      miniAppsObjs.push(m)
    }
  } else if (miniapp) {
    // A single miniapp string was provided (or local miniapp)
    const m = await spin(`Retrieving ${miniapp} MiniApp`,
      MiniApp.fromPackagePath(DependencyPath.fromString(miniapp)))
    miniAppsObjs.push(m)
  }

  try {
    await utils.performContainerStateUpdateInCauldron(async() => {
      for (const miniAppObj of miniAppsObjs) {
        // Add the MiniApp (and all it's dependencies if needed) to Cauldron
        await miniAppObj.addToNativeAppInCauldron(napDescriptor, force)
      }
    }, napDescriptor, { containerVersion })
    log.info(`MiniApp(s) version(s) was/were succesfully updated for ${napDescriptor.toString()} in Cauldron !`)
  } catch (e) {
    log.error(`An error occured while trying to update MiniApp(s) version(s) in Cauldron`)
  }
}

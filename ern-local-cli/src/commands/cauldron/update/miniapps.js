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

exports.command = 'miniapps <miniapps..>'
exports.desc = 'Update the version(s) of one or more MiniApp(s) in the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
  })
  .option('descriptor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force'
  })
  .epilog(utils.epilog(exports))
}

// Most/All of the logic here should be moved to the MiniApp class
// Commands should remain as much logic less as possible
exports.handler = async function ({
  miniapps,
  descriptor,
  force,
  containerVersion
} : {
  miniapps: Array<string>,
  containerVersion?: string,
  descriptor?: string,
  force?: boolean
}) {
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: miniapps,
    publishedToNpm: miniapps,
    miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: { miniApp: miniapps, napDescriptor }
  })

  //
  // Construct MiniApp objects array
  let miniAppsObjs = []
  const miniAppsDependencyPaths = _.map(miniapps, m => DependencyPath.fromString(m))
  for (const miniAppDependencyPath of miniAppsDependencyPaths) {
    const m = await spin(`Retrieving ${miniAppDependencyPath} MiniApp`,
        MiniApp.fromPackagePath(miniAppDependencyPath))
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

// @flow

import {
  cauldron,
  MiniApp
} from 'ern-core'
import {
  Dependency,
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'miniapp'
exports.desc = 'Update version(s) of ongit ce or more MiniApp(s) in the Cauldron'

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
  miniapps,
  descriptor,
  force = false,
  containerVersion
} : {
  miniapps?: Array<string>,
  descriptor: string,
  force: boolean,
  containerVersion?: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: miniapps,
    publishedToNpm: miniapps
  })

  //
  // Construct MiniApp objects array
  let miniAppsObjs = []
  if (miniapps) {
    const miniAppsDependencyPaths = _.map(miniapps, m => DependencyPath.fromString(m))
    for (const miniAppDependencyPath of miniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(miniAppDependencyPath)
      miniAppsObjs.push(m)
    }
  } else {
    log.info(`No MiniApps were explicitly provided. Assuming that this command is run from within a MiniApp directory`)
    miniAppsObjs = [ MiniApp.fromCurrentPath() ]
  }

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  //
  // Make sure that MiniApp(s) exist in the native application version
  // and that their versions are different than the ones to update to
  const miniAppsAsDependencies = _.map(miniapps, m => Dependency.fromString(m))
  for (const miniAppAsDependency of miniAppsAsDependencies) {
    const versionLessMiniAppDependencyString = miniAppAsDependency.withoutVersion().toString()
    const miniApp = await cauldron.getContainerMiniApp(napDescriptor, versionLessMiniAppDependencyString)
    if (!miniApp) {
      return log.error(`${versionLessMiniAppDependencyString} MiniApp does not exist in ${napDescriptor.toString()}`)
    }
    if (Dependency.fromString(miniApp).version === miniAppAsDependency.version) {
      return log.error(`${versionLessMiniAppDependencyString} MiniApp is already at version ${miniAppAsDependency.version}`)
    }
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

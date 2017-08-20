// @flow

import {
  MiniApp
} from 'ern-core'
import {
  DependencyPath,
  NativeApplicationDescriptor
} from 'ern-util'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'miniapp'
exports.desc = 'Add one or more MiniApp(s) to a given native application version in the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force publish'
  })
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, version will be patched bumped by default.'
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
  let miniapp
  if (!miniapps) {
    try {
      const miniappObj = MiniApp.fromCurrentPath()
      miniapp = miniappObj.packageDescriptor
    } catch (e) {
      return log.error(e)
    }
  }

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: miniapps,
    napDescriptorExistInCauldron: descriptor,
    publishedToNpm: miniapp || miniapps
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
    miniAppsObjs = [ MiniApp.fromCurrentPath() ]
  }

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  try {
    await utils.performContainerStateUpdateInCauldron(async () => {
      for (const miniAppObj of miniAppsObjs) {
        // Add the MiniApp (and all it's dependencies if needed) to Cauldron
        await miniAppObj.addToNativeAppInCauldron(napDescriptor, force)
      }
    }, napDescriptor, { containerVersion })
    log.info(`MiniApp(s) was/were succesfully added to ${napDescriptor.toString()} in the Cauldron !`)
  } catch (e) {
    log.error(`An error occured while trying to add MiniApp(s) to Cauldron`)
  }
}

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
  .option('descriptor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
  .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  miniapps,
  descriptor,
  force = false,
  containerVersion
} : {
  miniapps: Array<string>,
  descriptor?: string,
  force?: boolean,
  containerVersion?: string
}) {
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: { descriptor },
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: {
      obj: miniapps,
      extraErrorMessage: 'You cannot provide dependencies using git or file schme for this command. Only the form miniapp@version is allowed.'
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage: 'This command cannot work on a non existing native application version'
    },
    publishedToNpm: {
      obj: miniapps,
      extraErrorMessage: 'You can only add MiniApps versions that have been published to NPM'
    },
    miniAppNotInNativeApplicationVersionContainer: {
      miniApp: miniapps,
      napDescriptor,
      extraErrorMessage: 'If you want to update MiniApp(s) version(s), use -ern cauldron update miniapps- instead'
    }
  })

  //
  // Construct MiniApp objects array
  let miniAppsObjs = []
  // An array of miniapps strings was provided
  const miniAppsDependencyPaths = _.map(miniapps, m => DependencyPath.fromString(m))
  for (const miniAppDependencyPath of miniAppsDependencyPaths) {
    const m = await spin(`Retrieving ${miniAppDependencyPath} MiniApp`,
      MiniApp.fromPackagePath(miniAppDependencyPath))
    miniAppsObjs.push(m)
  }

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

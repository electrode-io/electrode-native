// @flow

import {
  MiniApp,
  PackagePath,
  NativeApplicationDescriptor,
  spin,
  utils as coreUtils,
  nativeDepenciesVersionResolution as resolver
} from 'ern-core'
import {
  getActiveCauldron
} from 'ern-cauldron-api'
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
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    }
  })
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
      isValidContainerVersion: containerVersion ? { containerVersion } : undefined,
      isNewerContainerVersion: containerVersion ? {
        containerVersion,
        descriptor,
        extraErrorMessage: 'To avoid conflicts with previous versions, you can only use container version newer than the current one'
      } : undefined,
      miniAppIsInNativeApplicationVersionContainer: {
        miniApp: miniapps,
        napDescriptor,
        extraErrorMessage: 'If you want to add a new MiniApp(s), use -ern cauldron add miniapps- instead'
      },
      miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
        miniApp: miniapps,
        napDescriptor,
        extraErrorMessage: 'It seems like you are trying to update a MiniApp to a version that is already the one in use.'
      }
    })

    let miniAppsObjs = []
    const miniAppsDependencyPaths = _.map(miniapps, m => PackagePath.fromString(m))
    for (const miniAppDependencyPath of miniAppsDependencyPaths) {
      const m = await spin(`Retrieving ${miniAppDependencyPath.toString()} MiniApp`,
        MiniApp.fromPackagePath(miniAppDependencyPath))
      miniAppsObjs.push(m)
    }

    const cauldron = await getActiveCauldron()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(napDescriptor)
    const nonUpdatedMiniAppsInCauldron = _.xorBy(miniAppsDependencyPaths, miniAppsInCauldron, 'basePath')
    let nonUpdatedMiniAppsInCauldronObjs = []
    for (const nonUpdatedMiniAppInCauldron of nonUpdatedMiniAppsInCauldron) {
      const m = await spin(`Retrieving ${nonUpdatedMiniAppInCauldron.toString()} MiniApp`,
        MiniApp.fromPackagePath(nonUpdatedMiniAppInCauldron))
      nonUpdatedMiniAppsInCauldronObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps([...miniAppsObjs, ...nonUpdatedMiniAppsInCauldronObjs])
    const cauldronDependencies = await cauldron.getNativeDependencies(napDescriptor)
    const finalNativeDependencies = resolver.retainHighestVersions(nativeDependencies.resolved, cauldronDependencies)

    utils.logNativeDependenciesConflicts(nativeDependencies, { throwIfConflict: !force })

    const cauldronCommitMessage = [
      `${miniapps.length === 1
      ? `Update ${miniapps[0]} MiniApp version in ${napDescriptor.toString()}`
      : `Update multiple MiniApps versions in ${napDescriptor.toString()}`}`
    ]

    await utils.performContainerStateUpdateInCauldron(
      async() => {
        for (const miniAppObj of miniAppsObjs) {
          cauldronCommitMessage.push(`- Update ${miniAppObj.name} MiniApp version to v${miniAppObj.version}`)
        }
        await cauldron.syncContainerMiniApps(napDescriptor, miniAppsDependencyPaths)
        await cauldron.syncContainerNativeDependencies(napDescriptor, finalNativeDependencies)
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.info(`MiniApp(s) version(s) was/were succesfully updated for ${napDescriptor.toString()} in Cauldron !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

// @flow

import {
  PackagePath,
  MiniApp,
  NativeApplicationDescriptor,
  spin,
  utils as coreUtils,
  nativeDepenciesVersionResolution as resolver
} from 'ern-core'
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
      isValidContainerVersion: containerVersion ? { containerVersion } : undefined,
      isNewerContainerVersion: containerVersion ? {
        containerVersion,
        descriptor,
        extraErrorMessage: 'To avoid conflicts with previous versions, you can only use container version newer than the current one'
      } : undefined,
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
      miniAppNotInNativeApplicationVersionContainer: {
        miniApp: miniapps,
        napDescriptor,
        extraErrorMessage: 'If you want to update MiniApp(s) version(s), use -ern cauldron update miniapps- instead'
      }
    })

    let miniAppsObjs = []
    const miniAppsDependencyPaths = _.map(miniapps, m => PackagePath.fromString(m))
    for (const miniAppDependencyPath of miniAppsDependencyPaths) {
      const m = await spin(`Retrieving ${miniAppDependencyPath.toString()} MiniApp`,
        MiniApp.fromPackagePath(miniAppDependencyPath))
      miniAppsObjs.push(m)
    }

    const cauldron = await coreUtils.getCauldronInstance()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(napDescriptor)
    let miniAppsInCauldronObjs = []
    for (const miniAppInCauldron of miniAppsInCauldron) {
      const m = await spin(`Retrieving ${miniAppInCauldron.toString()} MiniApp`,
        MiniApp.fromPackagePath(miniAppInCauldron))
      miniAppsInCauldronObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps([...miniAppsObjs, ...miniAppsInCauldronObjs])
    const cauldronDependencies = await cauldron.getNativeDependencies(napDescriptor)
    const finalNativeDependencies = resolver.retainHighestVersions(nativeDependencies.resolved, cauldronDependencies)

    utils.logNativeDependenciesConflicts(nativeDependencies, { throwIfConflict: !force })

    const cauldronCommitMessage = [
      `${miniapps.length === 1
      ? `Add ${miniapps[0]} MiniApp to ${napDescriptor.toString()}`
      : `Add multiple MiniApps to ${napDescriptor.toString()}`}`
    ]

    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const miniAppObj of miniAppsObjs) {
          cauldronCommitMessage.push(`- Add ${miniAppObj.packageDescriptor} MiniApp`)
        }
        await cauldron.syncContainerMiniApps(napDescriptor, miniAppsDependencyPaths)
        await cauldron.syncContainerNativeDependencies(napDescriptor, finalNativeDependencies)
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.debug(`MiniApp(s) was/were succesfully added to ${napDescriptor.toString()} in the Cauldron`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

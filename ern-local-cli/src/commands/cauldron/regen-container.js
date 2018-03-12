// @flow

import {
  MiniApp,
  spin,
  NativeApplicationDescriptor,
  utils as coreUtils,
  nativeDepenciesVersionResolution as resolver
} from 'ern-core'
import utils from '../../lib/utils'
import _ from 'lodash'

exports.command = 'regen-container'
exports.desc = 'Triggers the regeneration of a Container from the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
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
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force regen even if some conflicting native dependencies versions have been found'
  })
  .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  descriptor,
  containerVersion
} : {
  descriptor?: string,
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
      }
    })

    const cauldron = await coreUtils.getCauldronInstance()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(napDescriptor)
    const gitMiniAppsInCauldron = _.filter(miniAppsInCauldron, m => m.isGitPath === true)

    // For all MiniApps that are retrieved from git, we need to check if any
    // of their native dependencies versions have changed (or new one added)
    // in order to properly update the native dependencies list in the Cauldron
    let gitMiniAppsObjs = []
    for (const gitMiniAppInCauldron of gitMiniAppsInCauldron) {
      const m = await spin(`Retrieving ${gitMiniAppInCauldron.toString()} MiniApp`,
        MiniApp.fromPackagePath(gitMiniAppInCauldron))
      gitMiniAppsObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(gitMiniAppsObjs)
    const cauldronDependencies = await cauldron.getNativeDependencies(napDescriptor)
    const finalNativeDependencies = resolver.retainHighestVersions(nativeDependencies.resolved, cauldronDependencies)

    await utils.performContainerStateUpdateInCauldron(
      async () => {
        await cauldron.syncContainerNativeDependencies(napDescriptor, finalNativeDependencies)
      },
      napDescriptor,
      `Regenerate Container of ${napDescriptor.toString()} native application`,
      { containerVersion })
    log.debug(`Container was succesfully regenerated !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

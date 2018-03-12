// @flow

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  MiniApp,
  nativeDepenciesVersionResolution as resolver
} from 'ern-core'
import utils from '../../lib/utils'
import _ from 'lodash'

exports.command = 'batch'
exports.desc = 'Cauldron command to batch many operations as a single Cauldron update'

exports.builder = function (yargs: any) {
  return yargs
    .option('addDependencies', {
      type: 'array',
      describe: 'Adds one or more native dependencies to a native application version'
    })
    .option('addMiniapps', {
      type: 'array',
      describe: 'Adds one or more MiniApps to a native application version'
    })
    .option('delDependencies', {
      type: 'array',
      describe: 'Remove one or more native dependencies from a native application version'
    })
    .option('delMiniapps', {
      type: 'array',
      describe: 'Remove one or more MiniApps from a native application version'
    })
    .option('updateDependencies', {
      type: 'array',
      describe: 'Update one or more native dependencies versions in a native application version'
    })
    .option('updateMiniapps', {
      type: 'array',
      describe: 'Update one or more MiniApps versions in a native appplication version'
    })
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force the operations even if some compatibility checks are failing'
    })
    .option('containerVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Version to use for generated container. If none provided, current container version will be patch bumped.'
    })
    .option('descriptor', {
      type: 'string',
      alias: 'd',
      describe: 'A complete native application descriptor target of the operation'
    })
    .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  addDependencies = [],
  addMiniapps = [],
  delDependencies = [],
  delMiniapps = [],
  updateDependencies = [],
  updateMiniapps = [],
  force,
  containerVersion,
  descriptor
} : {
  addDependencies: Array<string>,
  addMiniapps: Array<string>,
  delDependencies: Array<string>,
  delMiniapps: Array<string>,
  updateDependencies: Array<string>,
  updateMiniapps: Array<string>,
  force?: boolean,
  containerVersion?: string,
  descriptor?: string
}) {
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage: 'A Cauldron must be active in order to use this command'
      },
      isCompleteNapDescriptorString: { descriptor },
      isValidContainerVersion: containerVersion ? { containerVersion } : undefined,
      isNewerContainerVersion: containerVersion ? {
        containerVersion,
        descriptor,
        extraErrorMessage: 'To avoid conflicts with previous versions, you can only use container version newer than the current one'
      } : undefined,
      noGitOrFilesystemPath: {
        obj: [ ...addDependencies, ...addMiniapps, ...delDependencies, ...delMiniapps, ...updateDependencies, ...updateMiniapps ],
        extraErrorMessage: 'You cannot provide dependency(ies) or MiniApp(s) using git or file scheme for this command. Only the form name@version is allowed.'
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: [ ...delDependencies, ...updateDependencies ],
        napDescriptor,
        extraErrorMessahe: 'This command cannot del or update dependency(ies) that do not exist in Cauldron.'
      },
      dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: {
        dependency: updateDependencies,
        napDescriptor,
        extraErrorMessage: 'It seems like you are trying to update a dependency to a version that is already the one in use.'
      },
      dependencyNotInNativeApplicationVersionContainer: {
        dependency: addDependencies,
        napDescriptor,
        extraErrorMessage: 'You cannot add dependencies that already exit in Cauldron. Please consider using update instead.'
      },
      dependencyNotInUseByAMiniApp: {
        dependency: [ ...delDependencies ],
        napDescriptor
      },
      miniAppIsInNativeApplicationVersionContainer: {
        miniApp: [ ...delMiniapps, ...updateMiniapps ],
        napDescriptor,
        extraErrorMessahe: 'This command cannot remove MiniApp(s) that do not exist in Cauldron.'
      },
      miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
        miniApp: updateMiniapps,
        napDescriptor,
        extraErrorMessage: 'It seems like you are trying to update a MiniApp to a version that is already the one in use.'
      },
      miniAppNotInNativeApplicationVersionContainer: {
        miniApp: addMiniapps,
        napDescriptor,
        extraErrorMessage: 'You cannot add MiniApp(s) that already exist yet in Cauldron. Please consider using update instead.'
      },
      publishedToNpm: {
        obj: [ ...addDependencies, ...addMiniapps, ...updateDependencies, ...updateMiniapps ],
        extraErrorMessage: 'You can only add or update dependency(ies) or MiniApp(s) wtih version(s) that have been published to NPM'
      }
    })

    const addDependenciesObjs = _.map(addDependencies, d => PackagePath.fromString(d))
    const delDependenciesObjs = _.map(delDependencies, d => PackagePath.fromString(d))
    const delMiniAppsAsDeps = _.map(delMiniapps, m => PackagePath.fromString(m))
    const updateDependenciesObjs = _.map(updateDependencies, d => PackagePath.fromString(d))

    let updateMiniAppsObjs = []
    const updateMiniAppsDependencyPaths = _.map(updateMiniapps, m => PackagePath.fromString(m))
    for (const updateMiniAppDependencyPath of updateMiniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(updateMiniAppDependencyPath)
      updateMiniAppsObjs.push(m)
    }

    let addMiniAppsObjs = []
    // An array of miniapps strings was provided
    const addMiniAppsDependencyPaths = _.map(addMiniapps, m => PackagePath.fromString(m))
    for (const addMiniAppDependencyPath of addMiniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(addMiniAppDependencyPath)
      addMiniAppsObjs.push(m)
    }

    const cauldronCommitMessage = [ `Batch operation on ${napDescriptor.toString()} native application` ]

    const cauldron = await coreUtils.getCauldronInstance()
    await utils.performContainerStateUpdateInCauldron(async () => {
      // Del Dependencies
      for (const delDependencyObj of delDependenciesObjs) {
        await cauldron.removeContainerNativeDependency(napDescriptor, delDependencyObj)
        cauldronCommitMessage.push(`- Remove ${delDependencyObj.toString()} native dependency`)
      }
      // Del MiniApps
      for (const delMiniAppAsDep of delMiniAppsAsDeps) {
        await cauldron.removeContainerMiniApp(napDescriptor, delMiniAppAsDep)
        cauldronCommitMessage.push(`- Remove ${delMiniAppAsDep.toString()} MiniApp`)
      }
      // Update Dependencies
      for (const updateDependencyObj of updateDependenciesObjs) {
        await cauldron.updateContainerNativeDependencyVersion(
          napDescriptor,
          updateDependencyObj.basePath,
          updateDependencyObj.version)
        cauldronCommitMessage.push(`- Update ${updateDependencyObj.basePath} native dependency version to v${updateDependencyObj.version}`)
      }
      // Add Dependencies
      for (const addDependencyObj of addDependenciesObjs) {
        // Add the dependency to Cauldron
        await cauldron.addContainerNativeDependency(napDescriptor, addDependencyObj)
        cauldronCommitMessage.push(`-Add ${addDependencyObj.toString()} native dependency`)
      }
      // Update MiniApps
      for (const updateMiniAppObj of updateMiniAppsObjs) {
        cauldronCommitMessage.push(`- Update ${updateMiniAppObj.name} MiniApp version to v${updateMiniAppObj.version}`)
      }
      // Add MiniApps
      for (const addMiniAppObj of addMiniAppsObjs) {
        cauldronCommitMessage.push(`-Add ${addMiniAppObj.packageDescriptor} MiniApp`)
      }

      const miniAppsInCauldron = await cauldron.getContainerMiniApps(napDescriptor)
      const nonUpdatedMiniAppsInCauldron = _.xorBy(updateMiniAppsDependencyPaths, miniAppsInCauldron, 'basePath')
      let nonUpdatedMiniAppsInCauldronObjs = []
      for (const nonUpdatedMiniAppInCauldron of nonUpdatedMiniAppsInCauldron) {
        const m = await MiniApp.fromPackagePath(nonUpdatedMiniAppInCauldron)
        nonUpdatedMiniAppsInCauldronObjs.push(m)
      }

      const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps([...updateMiniAppsObjs, ...addMiniAppsObjs, ...nonUpdatedMiniAppsInCauldronObjs])
      const cauldronDependencies = await cauldron.getNativeDependencies(napDescriptor)
      const finalNativeDependencies = resolver.retainHighestVersions(nativeDependencies.resolved, cauldronDependencies)

      utils.logNativeDependenciesConflicts(nativeDependencies, { throwIfConflict: !force })

      await cauldron.syncContainerMiniApps(napDescriptor, [...addMiniAppsDependencyPaths, ...updateMiniAppsDependencyPaths])
      await cauldron.syncContainerNativeDependencies(napDescriptor, finalNativeDependencies)
    },
    napDescriptor,
    cauldronCommitMessage,
    { containerVersion })
    log.info(`Operations were succesfully performed for ${napDescriptor.toString()}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

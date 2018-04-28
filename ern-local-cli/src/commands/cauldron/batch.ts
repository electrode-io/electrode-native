import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  MiniApp,
  nativeDepenciesVersionResolution as resolver,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../lib/utils'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'batch'
export const desc =
  'Cauldron command to batch many operations as a single Cauldron update'

export const builder = (argv: Argv) => {
  return argv
    .option('addDependencies', {
      describe:
        'Adds one or more native dependencies to a native application version',
      type: 'array',
    })
    .option('addMiniapps', {
      describe: 'Adds one or more MiniApps to a native application version',
      type: 'array',
    })
    .option('delDependencies', {
      describe:
        'Remove one or more native dependencies from a native application version',
      type: 'array',
    })
    .option('delMiniapps', {
      describe: 'Remove one or more MiniApps from a native application version',
      type: 'array',
    })
    .option('updateDependencies', {
      describe:
        'Update one or more native dependencies versions in a native application version',
      type: 'array',
    })
    .option('updateMiniapps', {
      describe:
        'Update one or more MiniApps versions in a native appplication version',
      type: 'array',
    })
    .option('force', {
      alias: 'f',
      describe:
        'Force the operations even if some compatibility checks are failing',
      type: 'boolean',
    })
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, current container version will be patch bumped.',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe:
        'A complete native application descriptor target of the operation',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  addDependencies = [],
  addMiniapps = [],
  delDependencies = [],
  delMiniapps = [],
  updateDependencies = [],
  updateMiniapps = [],
  force,
  containerVersion,
  descriptor,
}: {
  addDependencies: string[]
  addMiniapps: string[]
  delDependencies: string[]
  delMiniapps: string[]
  updateDependencies: string[]
  updateMiniapps: string[]
  force?: boolean
  containerVersion?: string
  descriptor?: string
}) => {
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: [...delDependencies, ...updateDependencies],
        extraErrorMessage:
          'This command cannot del or update dependency(ies) that do not exist in Cauldron.',
        napDescriptor,
      },
      dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: {
        dependency: updateDependencies,
        extraErrorMessage:
          'It seems like you are trying to update a dependency to a version that is already the one in use.',
        napDescriptor,
      },
      dependencyNotInNativeApplicationVersionContainer: {
        dependency: addDependencies,
        extraErrorMessage:
          'You cannot add dependencies that already exit in Cauldron. Please consider using update instead.',
        napDescriptor,
      },
      dependencyNotInUseByAMiniApp: {
        dependency: [...delDependencies],
        napDescriptor,
      },
      isCompleteNapDescriptorString: { descriptor },
      isNewerContainerVersion: containerVersion
        ? {
            containerVersion,
            descriptor,
            extraErrorMessage:
              'To avoid conflicts with previous versions, you can only use container version newer than the current one',
          }
        : undefined,
      isValidContainerVersion: containerVersion
        ? { containerVersion }
        : undefined,
      miniAppIsInNativeApplicationVersionContainer: {
        extraErrorMessage:
          'This command cannot remove MiniApp(s) that do not exist in Cauldron.',
        miniApp: [...delMiniapps, ...updateMiniapps],
        napDescriptor,
      },
      miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
        extraErrorMessage:
          'It seems like you are trying to update a MiniApp to a version that is already the one in use.',
        miniApp: updateMiniapps,
        napDescriptor,
      },
      miniAppNotInNativeApplicationVersionContainer: {
        extraErrorMessage:
          'You cannot add MiniApp(s) that already exist yet in Cauldron. Please consider using update instead.',
        miniApp: addMiniapps,
        napDescriptor,
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
      noGitOrFilesystemPath: {
        extraErrorMessage:
          'You cannot provide dependency(ies) or MiniApp(s) using git or file scheme for this command. Only the form name@version is allowed.',
        obj: [
          ...addDependencies,
          ...addMiniapps,
          ...delDependencies,
          ...delMiniapps,
          ...updateDependencies,
          ...updateMiniapps,
        ],
      },
      publishedToNpm: {
        extraErrorMessage:
          'You can only add or update dependency(ies) or MiniApp(s) wtih version(s) that have been published to NPM',
        obj: [
          ...addDependencies,
          ...addMiniapps,
          ...updateDependencies,
          ...updateMiniapps,
        ],
      },
    })

    const addDependenciesObjs = _.map(addDependencies, d =>
      PackagePath.fromString(d)
    )
    const delDependenciesObjs = _.map(delDependencies, d =>
      PackagePath.fromString(d)
    )
    const delMiniAppsAsDeps = _.map(delMiniapps, m => PackagePath.fromString(m))
    const updateDependenciesObjs = _.map(updateDependencies, d =>
      PackagePath.fromString(d)
    )

    const updateMiniAppsObjs = []
    const updateMiniAppsDependencyPaths = _.map(updateMiniapps, m =>
      PackagePath.fromString(m)
    )
    for (const updateMiniAppDependencyPath of updateMiniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(updateMiniAppDependencyPath)
      updateMiniAppsObjs.push(m)
    }

    const addMiniAppsObjs = []
    // An array of miniapps strings was provided
    const addMiniAppsDependencyPaths = _.map(addMiniapps, m =>
      PackagePath.fromString(m)
    )
    for (const addMiniAppDependencyPath of addMiniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(addMiniAppDependencyPath)
      addMiniAppsObjs.push(m)
    }

    const cauldronCommitMessage = [
      `Batch operation on ${napDescriptor.toString()} native application`,
    ]

    const cauldron = await getActiveCauldron()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        // Del Dependencies
        for (const delDependencyObj of delDependenciesObjs) {
          await cauldron.removeContainerNativeDependency(
            napDescriptor,
            delDependencyObj
          )
          cauldronCommitMessage.push(
            `- Remove ${delDependencyObj.toString()} native dependency`
          )
        }
        // Del MiniApps
        for (const delMiniAppAsDep of delMiniAppsAsDeps) {
          await cauldron.removeContainerMiniApp(napDescriptor, delMiniAppAsDep)
          cauldronCommitMessage.push(
            `- Remove ${delMiniAppAsDep.toString()} MiniApp`
          )
        }
        // Update Dependencies
        for (const updateDependencyObj of updateDependenciesObjs) {
          await cauldron.updateContainerNativeDependencyVersion(
            napDescriptor,
            updateDependencyObj.basePath,
            <string>updateDependencyObj.version
          )
          cauldronCommitMessage.push(
            `- Update ${
              updateDependencyObj.basePath
            } native dependency version to v${updateDependencyObj.version}`
          )
        }
        // Add Dependencies
        for (const addDependencyObj of addDependenciesObjs) {
          // Add the dependency to Cauldron
          await cauldron.addContainerNativeDependency(
            napDescriptor,
            addDependencyObj
          )
          cauldronCommitMessage.push(
            `-Add ${addDependencyObj.toString()} native dependency`
          )
        }
        // Update MiniApps
        for (const updateMiniAppObj of updateMiniAppsObjs) {
          cauldronCommitMessage.push(
            `- Update ${updateMiniAppObj.name} MiniApp version to v${
              updateMiniAppObj.version
            }`
          )
        }
        // Add MiniApps
        for (const addMiniAppObj of addMiniAppsObjs) {
          cauldronCommitMessage.push(
            `-Add ${addMiniAppObj.packageDescriptor} MiniApp`
          )
        }

        const miniAppsInCauldron = await cauldron.getContainerMiniApps(
          napDescriptor
        )
        const nonUpdatedMiniAppsInCauldron = _.xorBy(
          updateMiniAppsDependencyPaths,
          miniAppsInCauldron,
          'basePath'
        )
        const nonUpdatedMiniAppsInCauldronObjs = []
        for (const nonUpdatedMiniAppInCauldron of nonUpdatedMiniAppsInCauldron) {
          const m = await MiniApp.fromPackagePath(nonUpdatedMiniAppInCauldron)
          nonUpdatedMiniAppsInCauldronObjs.push(m)
        }

        const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
          [
            ...updateMiniAppsObjs,
            ...addMiniAppsObjs,
            ...nonUpdatedMiniAppsInCauldronObjs,
          ]
        )
        const cauldronDependencies = await cauldron.getNativeDependencies(
          napDescriptor
        )
        const finalNativeDependencies = resolver.retainHighestVersions(
          nativeDependencies.resolved,
          cauldronDependencies
        )

        utils.logNativeDependenciesConflicts(nativeDependencies, {
          throwIfConflict: !force,
        })

        await cauldron.syncContainerMiniApps(napDescriptor, [
          ...addMiniAppsDependencyPaths,
          ...updateMiniAppsDependencyPaths,
        ])
        await cauldron.syncContainerNativeDependencies(
          napDescriptor,
          finalNativeDependencies
        )
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(
      `Operations were succesfully performed for ${napDescriptor.toString()}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

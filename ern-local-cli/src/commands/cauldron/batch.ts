import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  MiniApp,
  nativeDepenciesVersionResolution as resolver,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { performContainerStateUpdateInCauldron } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  logNativeDependenciesConflicts,
} from '../../lib'
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
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
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
  descriptor?: NativeApplicationDescriptor
}) => {
  try {
    descriptor =
      descriptor ||
      (await askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      }))

    await logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: [...delDependencies, ...updateDependencies],
        descriptor,
        extraErrorMessage:
          'This command cannot del or update dependency(ies) that do not exist in Cauldron.',
      },
      dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: {
        dependency: updateDependencies,
        descriptor,
        extraErrorMessage:
          'It seems like you are trying to update a dependency to a version that is already the one in use.',
      },
      dependencyNotInNativeApplicationVersionContainer: {
        dependency: addDependencies,
        descriptor,
        extraErrorMessage:
          'You cannot add dependencies that already exit in Cauldron. Please consider using update instead.',
      },
      dependencyNotInUseByAMiniApp: {
        dependency: [...delDependencies],
        descriptor,
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
        descriptor,
        extraErrorMessage:
          'This command cannot remove MiniApp(s) that do not exist in Cauldron.',
        miniApp: [...delMiniapps, ...updateMiniapps],
      },
      miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
        descriptor,
        extraErrorMessage:
          'It seems like you are trying to update a MiniApp to a version that is already the one in use.',
        miniApp: updateMiniapps,
      },
      miniAppNotInNativeApplicationVersionContainer: {
        descriptor,
        extraErrorMessage:
          'You cannot add MiniApp(s) that already exist yet in Cauldron. Please consider using update instead.',
        miniApp: addMiniapps,
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

    const updateMiniAppsObjs: MiniApp[] = []
    const updateMiniAppsDependencyPaths = _.map(updateMiniapps, m =>
      PackagePath.fromString(m)
    )
    for (const updateMiniAppDependencyPath of updateMiniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(updateMiniAppDependencyPath)
      updateMiniAppsObjs.push(m)
    }

    const addMiniAppsObjs: MiniApp[] = []
    // An array of miniapps strings was provided
    const addMiniAppsDependencyPaths = _.map(addMiniapps, m =>
      PackagePath.fromString(m)
    )
    for (const addMiniAppDependencyPath of addMiniAppsDependencyPaths) {
      const m = await MiniApp.fromPackagePath(addMiniAppDependencyPath)
      addMiniAppsObjs.push(m)
    }

    const cauldronCommitMessage = [
      `Batch operation on ${descriptor} native application`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        // Del Dependencies
        for (const delDependencyObj of delDependenciesObjs) {
          await cauldron.removeContainerNativeDependency(
            descriptor!,
            delDependencyObj
          )
          cauldronCommitMessage.push(
            `- Remove ${delDependencyObj.toString()} native dependency`
          )
        }
        // Del MiniApps
        for (const delMiniAppAsDep of delMiniAppsAsDeps) {
          await cauldron.removeContainerMiniApp(descriptor!, delMiniAppAsDep)
          cauldronCommitMessage.push(
            `- Remove ${delMiniAppAsDep.toString()} MiniApp`
          )
        }
        // Update Dependencies
        for (const updateDependencyObj of updateDependenciesObjs) {
          await cauldron.updateContainerNativeDependencyVersion(
            descriptor!,
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
            descriptor!,
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
          descriptor!
        )
        const nonUpdatedMiniAppsInCauldron = _.xorBy(
          updateMiniAppsDependencyPaths,
          miniAppsInCauldron,
          'basePath'
        )
        const nonUpdatedMiniAppsInCauldronObjs: MiniApp[] = []
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
          descriptor!
        )
        const finalNativeDependencies = resolver.retainHighestVersions(
          nativeDependencies.resolved,
          cauldronDependencies
        )

        logNativeDependenciesConflicts(nativeDependencies, {
          throwIfConflict: !force,
        })

        await cauldron.syncContainerMiniApps(descriptor!, [
          ...addMiniAppsDependencyPaths,
          ...updateMiniAppsDependencyPaths,
        ])
        await cauldron.syncContainerNativeDependencies(
          descriptor!,
          finalNativeDependencies
        )
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(`Operations were succesfully performed for ${descriptor}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

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
    .coerce('addDependencies', d => d.map(PackagePath.fromString))
    .option('addMiniapps', {
      describe: 'Adds one or more MiniApps to a native application version',
      type: 'array',
    })
    .coerce('addMiniapps', d => d.map(PackagePath.fromString))
    .option('delDependencies', {
      describe:
        'Remove one or more native dependencies from a native application version',
      type: 'array',
    })
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, current container version will be patch bumped.',
      type: 'string',
    })
    .coerce('delDependencies', d => d.map(PackagePath.fromString))
    .option('delMiniapps', {
      describe: 'Remove one or more MiniApps from a native application version',
      type: 'array',
    })
    .coerce('delMiniapps', d => d.map(PackagePath.fromString))
    .option('descriptor', {
      alias: 'd',
      describe:
        'A complete native application descriptor target of the operation',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .option('force', {
      alias: 'f',
      describe:
        'Force the operations even if some compatibility checks are failing',
      type: 'boolean',
    })
    .option('updateDependencies', {
      describe:
        'Update one or more native dependencies versions in a native application version',
      type: 'array',
    })
    .coerce('updateDependencies', d => d.map(PackagePath.fromString))
    .option('updateMiniapps', {
      describe:
        'Update one or more MiniApps versions in a native appplication version',
      type: 'array',
    })
    .coerce('updateMiniapps', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const handler = async ({
  addDependencies = [],
  addMiniapps = [],
  containerVersion,
  delDependencies = [],
  delMiniapps = [],
  descriptor,
  force,
  updateDependencies = [],
  updateMiniapps = [],
}: {
  addDependencies: PackagePath[]
  addMiniapps: PackagePath[]
  containerVersion?: string
  delDependencies: PackagePath[]
  delMiniapps: PackagePath[]
  descriptor?: NativeApplicationDescriptor
  force?: boolean
  updateDependencies: PackagePath[]
  updateMiniapps: PackagePath[]
}) => {
  try {
    descriptor =
      descriptor ||
      (await askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      }))

    await logErrorAndExitIfNotSatisfied({
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

    const updateMiniAppsObjs: MiniApp[] = []
    const addMiniAppsObjs: MiniApp[] = []

    for (const updateMiniapp of updateMiniapps) {
      const m = await MiniApp.fromPackagePath(updateMiniapp)
      updateMiniAppsObjs.push(m)
    }

    for (const addMiniApp of addMiniapps) {
      const m = await MiniApp.fromPackagePath(addMiniApp)
      addMiniAppsObjs.push(m)
    }

    const cauldronCommitMessage = [
      `Batch operation on ${descriptor} native application`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        // Del Dependencies
        for (const delDependency of delDependencies) {
          await cauldron.removeContainerNativeDependency(
            descriptor!,
            delDependency
          )
          cauldronCommitMessage.push(
            `- Remove ${delDependency} native dependency`
          )
        }
        // Del MiniApps
        for (const delMiniApp of delMiniapps) {
          await cauldron.removeContainerMiniApp(descriptor!, delMiniApp)
          cauldronCommitMessage.push(`- Remove ${delMiniApp} MiniApp`)
        }
        // Update Dependencies
        for (const updateDependency of updateDependencies) {
          await cauldron.updateContainerNativeDependencyVersion(
            descriptor!,
            updateDependency.basePath,
            <string>updateDependency.version
          )
          cauldronCommitMessage.push(
            `- Update ${
              updateDependency.basePath
            } native dependency version to v${updateDependency.version}`
          )
        }
        // Add Dependencies
        for (const addDependency of addDependencies) {
          // Add the dependency to Cauldron
          await cauldron.addContainerNativeDependency(
            descriptor!,
            addDependency
          )
          cauldronCommitMessage.push(`-Add ${addDependency} native dependency`)
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
          updateMiniapps,
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
          throwOnConflict: !force,
        })

        await cauldron.syncContainerMiniApps(descriptor!, [
          ...addMiniapps,
          ...updateMiniapps,
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
    log.info(`Batch operations were succesfully performed for ${descriptor}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

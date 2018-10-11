import {
  PackagePath,
  MiniApp,
  NativeApplicationDescriptor,
  utils as coreUtils,
  nativeDepenciesVersionResolution as resolver,
  log,
  kax,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { performContainerStateUpdateInCauldron } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  logNativeDependenciesConflicts,
} from '../../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'miniapps <miniapps..>'
export const desc =
  'Add one or more MiniApp(s) to a given native application version in the Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('force', {
      alias: 'f',
      describe: 'Force publish',
      type: 'boolean',
    })
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, version will be patched bumped by default.',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'A complete native application descriptor',
      type: 'string',
    })
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

export const handler = async ({
  miniapps,
  descriptor,
  force = false,
  containerVersion,
}: {
  miniapps: string[]
  descriptor?: NativeApplicationDescriptor
  force?: boolean
  containerVersion?: string
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
      miniAppNotInNativeApplicationVersionContainer: {
        descriptor,
        extraErrorMessage:
          'If you want to update MiniApp(s) version(s), use -ern cauldron update miniapps- instead',
        miniApp: miniapps,
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
    })

    const miniAppsObjs: MiniApp[] = []
    const miniAppsDependencyPaths = _.map(miniapps, m =>
      PackagePath.fromString(m)
    )
    for (const miniAppDependencyPath of miniAppsDependencyPaths) {
      const m = await kax
        .task(`Retrieving ${miniAppDependencyPath.toString()} MiniApp`)
        .run(MiniApp.fromPackagePath(miniAppDependencyPath))
      miniAppsObjs.push(m)
    }

    const cauldron = await getActiveCauldron()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(descriptor)
    const miniAppsInCauldronObjs: MiniApp[] = []
    for (const miniAppInCauldron of miniAppsInCauldron) {
      const m = await kax
        .task(`Retrieving ${miniAppInCauldron.toString()} MiniApp`)
        .run(MiniApp.fromPackagePath(miniAppInCauldron))
      miniAppsInCauldronObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
      [...miniAppsObjs, ...miniAppsInCauldronObjs]
    )
    const cauldronDependencies = await cauldron.getNativeDependencies(
      descriptor
    )
    const finalNativeDependencies = resolver.retainHighestVersions(
      nativeDependencies.resolved,
      cauldronDependencies
    )

    logNativeDependenciesConflicts(nativeDependencies, {
      throwIfConflict: !force,
    })

    const cauldronCommitMessage = [
      `${
        miniapps.length === 1
          ? `Add ${miniapps[0]} MiniApp to ${descriptor}`
          : `Add multiple MiniApps to ${descriptor}`
      }`,
    ]

    await performContainerStateUpdateInCauldron(
      async () => {
        for (const miniAppObj of miniAppsObjs) {
          cauldronCommitMessage.push(
            `- Add ${miniAppObj.packageDescriptor} MiniApp`
          )
        }
        await cauldron.syncContainerMiniApps(
          descriptor!,
          miniAppsDependencyPaths
        )
        await cauldron.syncContainerNativeDependencies(
          descriptor!,
          finalNativeDependencies
        )
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(
      `MiniApp(s) was/were succesfully added to ${descriptor} in the Cauldron`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

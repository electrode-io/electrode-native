import {
  MiniApp,
  PackagePath,
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
  'Update the version(s) of one or more MiniApp(s) in the Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, patch version will be bumped by default.',
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
    .option('force', {
      alias: 'f',
      describe: 'Force',
      type: 'boolean',
    })
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

// Most/All of the logic here should be moved to the MiniApp class
// Commands should remain as much logic less as possible
export const handler = async ({
  containerVersion,
  descriptor,
  force,
  miniapps,
}: {
  containerVersion?: string
  descriptor?: NativeApplicationDescriptor
  force?: boolean
  miniapps: PackagePath[]
}) => {
  try {
    descriptor =
      descriptor ||
      (await askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      }))

    await logErrorAndExitIfNotSatisfied({
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
          'If you want to add a new MiniApp(s), use -ern cauldron add miniapps- instead',
        miniApp: miniapps,
      },
      miniAppIsInNativeApplicationVersionContainerWithDifferentVersion: {
        descriptor,
        extraErrorMessage:
          'It seems like you are trying to update a MiniApp to a version that is already the one in use.',
        miniApp: miniapps,
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
    })

    const miniAppsObjs: MiniApp[] = []
    for (const miniapp of miniapps) {
      const m = await kax
        .task(`Retrieving ${miniapp} MiniApp`)
        .run(MiniApp.fromPackagePath(miniapp))
      miniAppsObjs.push(m)
    }

    const cauldron = await getActiveCauldron()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(descriptor)
    const nonUpdatedMiniAppsInCauldron = _.xorBy(
      miniapps,
      miniAppsInCauldron,
      'basePath'
    )
    const nonUpdatedMiniAppsInCauldronObjs: MiniApp[] = []
    for (const nonUpdatedMiniAppInCauldron of nonUpdatedMiniAppsInCauldron) {
      const m = await kax
        .task(`Retrieving ${nonUpdatedMiniAppInCauldron.toString()} MiniApp`)
        .run(MiniApp.fromPackagePath(nonUpdatedMiniAppInCauldron))
      nonUpdatedMiniAppsInCauldronObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
      [...miniAppsObjs, ...nonUpdatedMiniAppsInCauldronObjs]
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
          ? `Update ${miniapps[0]} MiniApp version in ${descriptor}`
          : `Update multiple MiniApps versions in ${descriptor}`
      }`,
    ]

    await performContainerStateUpdateInCauldron(
      async () => {
        for (const miniAppObj of miniAppsObjs) {
          cauldronCommitMessage.push(
            `- Update ${miniAppObj.name} MiniApp version to v${
              miniAppObj.version
            }`
          )
        }
        await cauldron.syncContainerMiniApps(descriptor!, miniapps)
        await cauldron.syncContainerNativeDependencies(
          descriptor!,
          finalNativeDependencies
        )
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(
      `MiniApp(s) version(s) was/were succesfully updated for ${descriptor} in Cauldron !`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

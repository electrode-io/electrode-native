import {
  PackagePath,
  MiniApp,
  NativeApplicationDescriptor,
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
  tryCatchWrap,
} from '../../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'miniapps <miniapps..>'
export const desc =
  'Add one or more MiniApp(s) to a given native application version in the Cauldron'

export const builder = (argv: Argv) => {
  return argv
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
    .option('force', {
      alias: 'f',
      default: false,
      describe: 'Force publish',
      type: 'boolean',
    })
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
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
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
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
  for (const miniapp of miniapps) {
    const m = await kax
      .task(`Retrieving ${miniapp} MiniApp`)
      .run(MiniApp.fromPackagePath(miniapp))
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
  const cauldronDependencies = await cauldron.getNativeDependencies(descriptor)
  const finalNativeDependencies = resolver.retainHighestVersions(
    nativeDependencies.resolved,
    cauldronDependencies
  )

  logNativeDependenciesConflicts(nativeDependencies, {
    throwOnConflict: !force,
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
  log.debug(`MiniApp(s) successfully added to ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

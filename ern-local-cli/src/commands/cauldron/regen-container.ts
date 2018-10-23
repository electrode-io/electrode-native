import {
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
  tryCatchWrap,
} from '../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'regen-container'
export const desc = 'Triggers the regeneration of a Container from the Cauldron'

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
      describe:
        'Force regen even if some conflicting native dependencies versions have been found',
      type: 'boolean',
    })
    .option('fullRegen', {
      describe: 'Perform complete regeneration',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  fullRegen,
}: {
  containerVersion?: string
  descriptor?: NativeApplicationDescriptor
  fullRegen?: boolean
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
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()

  // Figure out the list of all git MiniApps that have been updated (new HEAD sha)
  const updatedGitMiniApps = await cauldron.getLatestShasForMiniAppsBranches(
    descriptor
  )
  const gitMiniAppsObjs: MiniApp[] = []
  // We need to retrieve these updated MiniApps as their native dependencies might
  // have changed
  for (const updatedGitMiniApp of updatedGitMiniApps) {
    const m = await kax
      .task(`Retrieving ${updatedGitMiniApp} MiniApp`)
      .run(MiniApp.fromPackagePath(updatedGitMiniApp))
    gitMiniAppsObjs.push(m)
  }

  const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
    gitMiniAppsObjs
  )

  const cauldronDependencies = await cauldron.getNativeDependencies(descriptor)
  const finalNativeDependencies = resolver.retainHighestVersions(
    nativeDependencies.resolved,
    cauldronDependencies
  )
  await performContainerStateUpdateInCauldron(
    async () => {
      for (const updatedGitMiniApp of updatedGitMiniApps) {
        await cauldron.updateContainerMiniAppVersion(
          descriptor!,
          updatedGitMiniApp,
          { keepBranch: true }
        )
      }
      await cauldron.syncContainerNativeDependencies(
        descriptor!,
        finalNativeDependencies
      )
    },
    descriptor,
    `Regenerate Container of ${descriptor} native application`,
    { containerVersion, forceFullGeneration: fullRegen }
  )
  log.info(`${descriptor} container was successfully regenerated`)
}

export const handler = tryCatchWrap(commandHandler)

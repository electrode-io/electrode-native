import {
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
    .epilog(epilog(exports))
}

export const handler = async ({
  containerVersion,
  descriptor,
}: {
  containerVersion?: string
  descriptor?: NativeApplicationDescriptor
}) => {
  await logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })
  try {
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
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(descriptor)
    const gitMiniAppsInCauldron = _.filter(
      miniAppsInCauldron,
      m => m.isGitPath === true
    )

    // For all MiniApps that are retrieved from git, we need to check if any
    // of their native dependencies versions have changed (or new one added)
    // in order to properly update the native dependencies list in the Cauldron
    const gitMiniAppsObjs: MiniApp[] = []
    for (const gitMiniAppInCauldron of gitMiniAppsInCauldron) {
      const m = await kax
        .task(`Retrieving ${gitMiniAppInCauldron.toString()} MiniApp`)
        .run(MiniApp.fromPackagePath(gitMiniAppInCauldron))
      gitMiniAppsObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
      gitMiniAppsObjs
    )
    const cauldronDependencies = await cauldron.getNativeDependencies(
      descriptor
    )
    const finalNativeDependencies = resolver.retainHighestVersions(
      nativeDependencies.resolved,
      cauldronDependencies
    )
    await performContainerStateUpdateInCauldron(
      async () => {
        await cauldron.syncContainerNativeDependencies(
          descriptor!,
          finalNativeDependencies
        )
      },
      descriptor,
      `Regenerate Container of ${descriptor} native application`,
      { containerVersion, forceFullGeneration: true }
    )
    log.debug(`Container was succesfully regenerated !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

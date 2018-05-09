import {
  MiniApp,
  spin,
  NativeApplicationDescriptor,
  utils as coreUtils,
  nativeDepenciesVersionResolution as resolver,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../lib/utils'
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
    .option('force', {
      alias: 'f',
      describe:
        'Force regen even if some conflicting native dependencies versions have been found',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  descriptor,
  containerVersion,
}: {
  descriptor?: string
  containerVersion?: string
}) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
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
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
    })

    const cauldron = await getActiveCauldron()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(
      napDescriptor
    )
    const gitMiniAppsInCauldron = _.filter(
      miniAppsInCauldron,
      m => m.isGitPath === true
    )

    // For all MiniApps that are retrieved from git, we need to check if any
    // of their native dependencies versions have changed (or new one added)
    // in order to properly update the native dependencies list in the Cauldron
    const gitMiniAppsObjs: MiniApp[] = []
    for (const gitMiniAppInCauldron of gitMiniAppsInCauldron) {
      const m = await spin(
        `Retrieving ${gitMiniAppInCauldron.toString()} MiniApp`,
        MiniApp.fromPackagePath(gitMiniAppInCauldron)
      )
      gitMiniAppsObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
      gitMiniAppsObjs
    )
    const cauldronDependencies = await cauldron.getNativeDependencies(
      napDescriptor
    )
    const finalNativeDependencies = resolver.retainHighestVersions(
      nativeDependencies.resolved,
      cauldronDependencies
    )

    await utils.performContainerStateUpdateInCauldron(
      async () => {
        await cauldron.syncContainerNativeDependencies(
          napDescriptor,
          finalNativeDependencies
        )
      },
      napDescriptor,
      `Regenerate Container of ${napDescriptor.toString()} native application`,
      { containerVersion }
    )
    log.debug(`Container was succesfully regenerated !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

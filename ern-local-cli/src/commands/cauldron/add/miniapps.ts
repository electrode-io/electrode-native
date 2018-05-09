import {
  PackagePath,
  MiniApp,
  NativeApplicationDescriptor,
  spin,
  utils as coreUtils,
  nativeDepenciesVersionResolution as resolver,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
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
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  miniapps,
  descriptor,
  force = false,
  containerVersion,
}: {
  miniapps: string[]
  descriptor?: string
  force?: boolean
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
      miniAppNotInNativeApplicationVersionContainer: {
        extraErrorMessage:
          'If you want to update MiniApp(s) version(s), use -ern cauldron update miniapps- instead',
        miniApp: miniapps,
        napDescriptor,
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
      const m = await spin(
        `Retrieving ${miniAppDependencyPath.toString()} MiniApp`,
        MiniApp.fromPackagePath(miniAppDependencyPath)
      )
      miniAppsObjs.push(m)
    }

    const cauldron = await getActiveCauldron()
    const miniAppsInCauldron = await cauldron.getContainerMiniApps(
      napDescriptor
    )
    const miniAppsInCauldronObjs: MiniApp[] = []
    for (const miniAppInCauldron of miniAppsInCauldron) {
      const m = await spin(
        `Retrieving ${miniAppInCauldron.toString()} MiniApp`,
        MiniApp.fromPackagePath(miniAppInCauldron)
      )
      miniAppsInCauldronObjs.push(m)
    }

    const nativeDependencies = await resolver.resolveNativeDependenciesVersionsOfMiniApps(
      [...miniAppsObjs, ...miniAppsInCauldronObjs]
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

    const cauldronCommitMessage = [
      `${
        miniapps.length === 1
          ? `Add ${miniapps[0]} MiniApp to ${napDescriptor.toString()}`
          : `Add multiple MiniApps to ${napDescriptor.toString()}`
      }`,
    ]

    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const miniAppObj of miniAppsObjs) {
          cauldronCommitMessage.push(
            `- Add ${miniAppObj.packageDescriptor} MiniApp`
          )
        }
        await cauldron.syncContainerMiniApps(
          napDescriptor,
          miniAppsDependencyPaths
        )
        await cauldron.syncContainerNativeDependencies(
          napDescriptor,
          finalNativeDependencies
        )
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(
      `MiniApp(s) was/were succesfully added to ${napDescriptor.toString()} in the Cauldron`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import {
  NativeApplicationDescriptor,
  PackagePath,
  utils as coreUtils,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'miniapps <miniapps..>'
export const desc = 'Remove one or more MiniApp(s) from the cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, version will be patch bumped by default',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'A complete native application descriptor',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

// This command does not actually removes or offers to remove dependencies that were
// only used by this MiniApp
// It could be done as a future improvement to this command
export const handler = async ({
  miniapps,
  containerVersion,
  descriptor,
}: {
  miniapps: string[]
  containerVersion?: string
  descriptor?: string
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
      miniAppIsInNativeApplicationVersionContainer: {
        extraErrorMessage:
          'This command cannot remove MiniApp(s) that do not exist in Cauldron.',
        miniApp: miniapps,
        napDescriptor,
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
      noGitOrFilesystemPath: {
        extraErrorMessage:
          'You cannot provide MiniApp(s) using git or file scheme for this command. Only the form miniapp@version is allowed.',
        obj: miniapps,
      },
    })

    const miniAppsAsDeps = _.map(miniapps, m => PackagePath.fromString(m))

    const cauldronCommitMessage = [
      `${
        miniapps.length === 1
          ? `Remove ${miniapps[0]} MiniApp from ${napDescriptor.toString()}`
          : `Remove multiple MiniApps from ${napDescriptor.toString()}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const miniAppAsDep of miniAppsAsDeps) {
          await cauldron.removeContainerMiniApp(napDescriptor, miniAppAsDep)
          cauldronCommitMessage.push(
            `- Remove ${miniAppAsDep.toString()} MiniApp`
          )
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(
      `MiniApp(s) was/were succesfully removed from ${napDescriptor.toString()}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

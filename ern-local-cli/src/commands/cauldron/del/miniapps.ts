import {
  NativeApplicationDescriptor,
  PackagePath,
  utils as coreUtils,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { performContainerStateUpdateInCauldron } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
} from '../../../lib'
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
    .coerce('miniapps', d => d.map(PackagePath.fromString))
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

// This command does not actually removes or offers to remove dependencies that were
// only used by this MiniApp
// It could be done as a future improvement to this command
export const handler = async ({
  miniapps,
  containerVersion,
  descriptor,
}: {
  miniapps: PackagePath[]
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
        miniApp: miniapps,
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

    const cauldronCommitMessage = [
      `${
        miniapps.length === 1
          ? `Remove ${miniapps[0]} MiniApp from ${descriptor}`
          : `Remove multiple MiniApps from ${descriptor}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        for (const miniapp of miniapps) {
          await cauldron.removeContainerMiniApp(descriptor!, miniapp)
          cauldronCommitMessage.push(`- Remove ${miniapp} MiniApp`)
        }
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(`MiniApp(s) was/were succesfully removed from ${descriptor}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

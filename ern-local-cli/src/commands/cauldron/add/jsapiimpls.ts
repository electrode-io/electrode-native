import {
  PackagePath,
  NativeApplicationDescriptor,
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
import { Argv } from 'yargs'

export const command = 'jsapiimpls <jsapiimpls..>'
export const desc =
  'Add one or more JS API implementation(s) to a given native application version in the Cauldron'

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
    .coerce('jsapiimpls', d => d.map(PackagePath.fromString))
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

export const handler = async ({
  jsapiimpls,
  descriptor,
  containerVersion,
}: {
  jsapiimpls: PackagePath[]
  descriptor?: NativeApplicationDescriptor
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
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
    })

    const cauldronCommitMessage = [
      `${
        jsapiimpls.length === 1
          ? `Add ${jsapiimpls[0]} JS API implementation to ${descriptor}`
          : `Add multiple JS API implementations to ${descriptor}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        for (const jsApiImpl of jsapiimpls) {
          await cauldron.addContainerJsApiImpl(descriptor!, jsApiImpl)
          cauldronCommitMessage.push(`- Add ${jsApiImpl} JS API implementation`)
        }
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(
      `JS API implementation(s) was/were succesfully added to ${descriptor} in the Cauldron`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

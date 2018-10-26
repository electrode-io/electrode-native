import { PackagePath, NativeApplicationDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { performContainerStateUpdateInCauldron } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
  emptyContainerIfSingleMiniAppOrJsApiImpl,
} from '../../../lib'
import { Argv } from 'yargs'

export const command = 'jsapiimpls <jsapiimpls..>'
export const desc =
  'Remove one or more JS API implementation(s) from a given native application version in the Cauldron'

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
    .coerce('jsapiimpls', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  jsapiimpls,
}: {
  containerVersion?: string
  descriptor?: NativeApplicationDescriptor
  jsapiimpls: PackagePath[]
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

  const cauldronCommitMessage = [
    `${
      jsapiimpls.length === 1
        ? `Remove ${jsapiimpls[0]} JS API implementation from ${descriptor}`
        : `Remove multiple JS API implementations from ${descriptor}`
    }`,
  ]

  if (!(await emptyContainerIfSingleMiniAppOrJsApiImpl(descriptor))) {
    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        for (const jsApiImpl of jsapiimpls) {
          await cauldron.removeJsApiImplFromContainer(descriptor!, jsApiImpl)
          cauldronCommitMessage.push(
            `- Remove ${jsApiImpl} JS API implementation`
          )
        }
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
  }
  log.info(`JS API implementation(s) successfully removed from ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

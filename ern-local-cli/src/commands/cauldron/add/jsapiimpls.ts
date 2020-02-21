import { PackagePath, AppVersionDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../../../lib'
import { Argv } from 'yargs'

export const command = 'jsapiimpls <jsapiimpls..>'
export const desc =
  'Add one or more JS API implementation(s) to a given native application version in the Cauldron'

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
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .coerce('jsapiimpls', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  jsapiimpls,
}: {
  containerVersion?: string
  descriptor?: AppVersionDescriptor
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
    isSupportedMiniAppOrJsApiImplVersion: {
      obj: jsapiimpls,
    },
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
  await syncCauldronContainer(
    async () => {
      for (const jsApiImpl of jsapiimpls) {
        cauldronCommitMessage.push(`- Add ${jsApiImpl} JS API Implementation`)
      }
      await cauldron.syncContainerJsApiImpls(descriptor!, jsapiimpls)
    },
    descriptor,
    cauldronCommitMessage,
    { containerVersion }
  )
  log.info(`JS API implementation(s) successfully added to ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

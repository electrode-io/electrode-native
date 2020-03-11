import { PackagePath, AppVersionDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'jsapiimpls <jsapiimpls..>'
export const desc = 'Update one or more JS API implementation(s)'

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
    .option('resetCache', {
      default: false,
      describe:
        'Indicates whether to reset the React Native cache prior to bundling',
      type: 'boolean',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  descriptor,
  jsapiimpls,
  resetCache,
}: {
  containerVersion?: string
  descriptor?: AppVersionDescriptor
  jsapiimpls: PackagePath[]
  resetCache?: boolean
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
        ? `Update ${jsapiimpls[0]} JS API implementation version in ${descriptor}`
        : `Update multiple JS API implementations in ${descriptor}`
    }`,
  ]

  const cauldron = await getActiveCauldron()
  await syncCauldronContainer(
    async () => {
      for (const jsapiimpl of jsapiimpls) {
        cauldronCommitMessage.push(
          `- Update ${jsapiimpl.basePath} JS API implementation version`
        )
      }
      await cauldron.syncContainerJsApiImpls(descriptor!, jsapiimpls)
    },
    descriptor,
    cauldronCommitMessage,
    { containerVersion, resetCache }
  )
  log.info(`JS API implementation(s) successfully updated in ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

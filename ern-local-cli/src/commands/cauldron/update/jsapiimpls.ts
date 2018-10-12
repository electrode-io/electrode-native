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
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .coerce('jsapiimpls', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const handler = async ({
  containerVersion,
  descriptor,
  jsapiimpls,
}: {
  containerVersion?: string
  descriptor?: NativeApplicationDescriptor
  jsapiimpls: PackagePath[]
}) => {
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

    const cauldronCommitMessage = [
      `${
        jsapiimpls.length === 1
          ? `Update ${
              jsapiimpls[0]
            } JS API implementation version in ${descriptor}`
          : `Update multiple JS API implementations in ${descriptor}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        for (const jsapiimpl of jsapiimpls) {
          if (!jsapiimpl.version) {
            log.error(
              `Will not update ${jsapiimpl} as it does not specify a version`
            )
            continue
          }
          await cauldron.updateContainerJsApiImplVersion(
            descriptor!,
            jsapiimpl.basePath,
            jsapiimpl.version
          )
          cauldronCommitMessage.push(
            `- Update ${jsapiimpl.basePath} JS API implementation version`
          )
        }
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(
      `JS API implementation(s) was/were succesfully updated in ${descriptor}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
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
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  jsapiimpls,
  descriptor,
  containerVersion,
}: {
  jsapiimpls: string[]
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

    const cauldronCommitMessage = [
      `${
        jsapiimpls.length === 1
          ? `Update ${
              jsapiimpls[0]
            } JS API implementation version in ${napDescriptor.toString()}`
          : `Update multiple JS API implementations in ${napDescriptor.toString()}`
      }`,
    ]

    const jsApiImplPackagePaths = _.map(jsapiimpls, j =>
      PackagePath.fromString(j)
    )

    const cauldron = await getActiveCauldron()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const jsApiImplPackagePath of jsApiImplPackagePaths) {
          if (!jsApiImplPackagePath.version) {
            log.error(
              `Will not update ${jsApiImplPackagePath.toString()} as it does not specify a version`
            )
            continue
          }
          await cauldron.updateContainerJsApiImplVersion(
            napDescriptor,
            jsApiImplPackagePath.basePath,
            jsApiImplPackagePath.version
          )
          cauldronCommitMessage.push(
            `- Update ${
              jsApiImplPackagePath.basePath
            } JS API implementation version`
          )
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.debug(
      `JS API implementation(s) was/were succesfully updated in ${napDescriptor.toString()}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

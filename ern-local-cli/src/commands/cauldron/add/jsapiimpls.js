// @flow

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'jsapiimpls <jsapiimpls..>'
exports.desc = 'Add one or more JS API implementation(s) to a given native application version in the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force publish'
  })
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, version will be patched bumped by default.'
  })
  .option('descriptor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
  .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  jsapiimpls,
  descriptor,
  force = false,
  containerVersion
} : {
  jsapiimpls: Array<string>,
  descriptor?: string,
  force?: boolean,
  containerVersion?: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    }
  })
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      isValidContainerVersion: containerVersion ? { containerVersion } : undefined,
      isNewerContainerVersion: containerVersion ? {
        containerVersion,
        descriptor,
        extraErrorMessage: 'To avoid conflicts with previous versions, you can only use container version newer than the current one'
      } : undefined,
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      }
    })

    const cauldronCommitMessage = [
      `${jsapiimpls.length === 1
      ? `Add ${jsapiimpls[0]} JS API implementation to ${napDescriptor.toString()}`
      : `Add multiple JS API implementations to ${napDescriptor.toString()}`}`
    ]

    const cauldron = await coreUtils.getCauldronInstance()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const jsApiImpl of jsapiimpls) {
          await cauldron.addContainerJsApiImpl(napDescriptor, PackagePath.fromString(jsApiImpl))
          cauldronCommitMessage.push(`- Add ${jsApiImpl} JS API implementation`)
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.debug(`JS API implementation(s) was/were succesfully added to ${napDescriptor.toString()} in the Cauldron`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'
import utils from '../../lib/utils'

exports.command = 'regen-container'
exports.desc = 'Triggers the regeneration of a Container from the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
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
  descriptor,
  containerVersion
} : {
  descriptor?: string,
  containerVersion?: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    }
  })

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

  try {
    await utils.performContainerStateUpdateInCauldron(async () => {
      return Promise.resolve()
    }, napDescriptor, { containerVersion })
    log.debug(`Container was succesfully regenerated !`)
  } catch (e) {
    log.error(`An error occured while trying to regenerate the container : ${e.message}`)
  }
}

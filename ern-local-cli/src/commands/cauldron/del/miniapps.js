// @flow

import {
  NativeApplicationDescriptor,
  Dependency,
  Utils
} from 'ern-util'
import {
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'miniapps <miniapps..>'
exports.desc = 'Remove one or more MiniApp(s) from the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, version will be patch bumped by default'
  })
  .option('descriptor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
  .epilog(utils.epilog(exports))
}

// This command does not actually removes or offers to remove dependencies that were
// only used by this MiniApp
// It could be done as a future improvement to this command
exports.handler = async function ({
  miniapps,
  containerVersion,
  descriptor
} : {
  miniapps: Array<string>,
  containerVersion?: string,
  descriptor?: string
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
      noGitOrFilesystemPath: {
        obj: miniapps,
        extraErrorMessage: 'You cannot provide MiniApp(s) using git or file scheme for this command. Only the form miniapp@version is allowed.'
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
      miniAppIsInNativeApplicationVersionContainer: {
        miniApp: miniapps,
        napDescriptor,
        extraErrorMessahe: 'This command cannot remove MiniApp(s) that do not exist in Cauldron.'
      }
    })

    const miniAppsAsDeps = _.map(miniapps, m => Dependency.fromString(m))

    const cauldronCommitMessage = [
      `${miniapps.length === 1
      ? `Remove ${miniapps[0]} MiniApp from ${napDescriptor.toString()}`
      : `Remove multiple MiniApps from ${napDescriptor.toString()}`}`
    ]

    const cauldron = await coreUtils.getCauldronInstance()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const miniAppAsDep of miniAppsAsDeps) {
          await cauldron.removeMiniAppFromContainer(napDescriptor, miniAppAsDep)
          cauldronCommitMessage.push(`- Remove ${miniAppAsDep.toString()} MiniApp`)
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.debug(`MiniApp(s) was/were succesfully removed from ${napDescriptor.toString()}`)
  } catch (e) {
    Utils.logErrorAndExitProcess(e)
  }
}

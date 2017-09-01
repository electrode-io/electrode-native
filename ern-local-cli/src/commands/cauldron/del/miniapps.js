// @flow

import {
  NativeApplicationDescriptor,
  Dependency
} from 'ern-util'
import {
  cauldron
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
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: { descriptor },
    isValidContainerVersion: containerVersion,
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

  try {
    await utils.performContainerStateUpdateInCauldron(async () => {
      for (const miniAppAsDep of miniAppsAsDeps) {
        await cauldron.removeMiniAppFromContainer(napDescriptor, miniAppAsDep)
      }
    }, napDescriptor, { containerVersion })
    log.info(`MiniApp(s) was/were succesfully removed from ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to remove MiniApp(s) from ${napDescriptor.toString()}`)
  }
}

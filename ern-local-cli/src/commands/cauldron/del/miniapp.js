// @flow

import {
  NativeApplicationDescriptor,
  Dependency
} from 'ern-util'
import {
  cauldron,
  MiniApp
} from 'ern-core'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'miniapp [miniapp]'
exports.desc = 'Remove one or more MiniApp(s) from the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, version will be patch bumped by default'
  })
  .option('miniapps', {
    type: 'array',
    alias: 'm',
    describe: 'A list of one or more miniapps'
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
  descriptor,
  miniapp,
  miniapps = [],
  containerVersion
} : {
  descriptor?: string,
  miniapp?: string,
  miniapps: Array<string>,
  containerVersion?: string
}) {
  if (!miniapp && miniapps.length === 0) {
    try {
      miniapps.push(MiniApp.fromCurrentPath().packageDescriptor)
    } catch (e) {
      return log.error(e.message)
    }
  } else if (miniapp && miniapps.length === 0) {
    miniapps.push(miniapp)
  }

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: miniapps,
    napDescriptorExistInCauldron: descriptor,
    miniAppIsInNativeApplicationVersionContainer: { miniApp: miniapps, napDescriptor }
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

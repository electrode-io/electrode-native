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

exports.command = 'miniapp [miniapp]'
exports.desc = 'Remove one or more MiniApp(s) from the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
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
}

// This command does not actually removes or offers to remove dependencies that were
// only used by this MiniApp
// It could be done as a future improvement to this command
exports.handler = async function ({
  descriptor,
  miniapp,
  miniapps,
  containerVersion
} : {
  descriptor?: string,
  miniapp?: string,
  miniapps?: Array<string>,
  containerVersion?: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: miniapp || miniapps,
    napDescriptorExistInCauldron: descriptor
  })

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const miniAppsAsDeps = miniapp
    ? [ Dependency.fromString(miniapp) ]
    : _.map(miniapps, m => Dependency.fromString(m))

  for (const miniAppAsDep of miniAppsAsDeps) {
    const miniAppString = await cauldron.getContainerMiniApp(napDescriptor, miniAppAsDep.toString())
    if (!miniAppString) {
      return log.error(`${miniAppAsDep.toString()} MiniApp is not present in ${descriptor} container !`)
    }
  }

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

// @flow

import {
  NativeApplicationDescriptor,
  Dependency
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import {
  runCauldronContainerGen
} from '../../../lib/publication'
import Ensure from '../../../lib/Ensure'
import utils from '../../../lib/utils'
import semver from 'semver'
import inquirer from 'inquirer'
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
}

// This command does not actually removes or offers to remove dependencies that were
// only used by this MiniApp
// It could be done as a future improvement to this command
exports.handler = async function ({
  completeNapDescriptor,
  miniapp,
  miniapps,
  containerVersion
} : {
  completeNapDescriptor?: string,
  miniapp?: string,
  miniapps?: Array<String>,
  containerVersion?: string
}) {
  if (containerVersion) {
    Ensure.isValidContainerVersion(containerVersion)
  }
  if (completeNapDescriptor) {
    Ensure.isCompleteNapDescriptorString(completeNapDescriptor)
  }

   //
  // If no 'completeNapDescriptor' was provided, list all non released
  // native application versions from the Cauldron, so that user can
  // choose one of them to add the MiniApp(s) to
  if (!completeNapDescriptor) {
    const napDescriptorStrings = utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true })

    const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([{
      type: 'list',
      name: 'userSelectedCompleteNapDescriptor',
      message: 'Choose a non released native application version in which you want to add this MiniApp',
      choices: napDescriptorStrings
    }])

    completeNapDescriptor = userSelectedCompleteNapDescriptor
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  const miniAppsAsDeps = miniapp
    ? [ Dependency.fromString(miniapp) ]
    : _.map(miniapps, m => Dependency.fromString(m))

  for (const miniAppAsDep of miniAppsAsDeps) {
    const miniAppString = await cauldron.getContainerMiniApp(napDescriptor, miniAppAsDep.toString())
    if (!miniAppString) {
      return log.error(`${miniAppAsDep.toString()} MiniApp is not present in ${completeNapDescriptor} container !`)
    }
  }

  try {
    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    // Set the container version to use for container generation
    let cauldronContainerVersion
    if (containerVersion) {
      log.debug(`Using user provided container version : ${containerVersion}`)
      cauldronContainerVersion = containerVersion
    } else {
      cauldronContainerVersion = await cauldron.getContainerVersion(napDescriptor)
      cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
      log.debug(`Bumping container version from cauldron : ${cauldronContainerVersion}`)
    }

    for (const miniAppAsDep of miniAppsAsDeps) {
      await cauldron.removeMiniAppFromContainer(napDescriptor, miniAppAsDep)
    }

    // Run container generator
    await runCauldronContainerGen(
      napDescriptor,
      cauldronContainerVersion,
      { publish: true })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await cauldron.commitTransaction()

    log.info(`MiniApp(s) was/were succesfully removed from ${napDescriptor.toString()}`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to remove MiniApp(s) from ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

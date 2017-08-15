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
import semver from 'semver'

exports.command = 'miniapp <completeNapDescriptor> <miniAppName>'
exports.desc = 'Remove a mini app from the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
  })
}

// This command does not actually removes or offers to remove dependencies that were
// only used by this MiniApp
// It could be done as a future improvement to this command
exports.handler = async function ({
  completeNapDescriptor,
  miniAppName,
  containerVersion
} : {
  completeNapDescriptor: string,
  miniAppName: string,
  containerVersion?: string
}) {
  if (containerVersion) {
    ensureValidContainerVersion(containerVersion)
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  const miniAppString = await cauldron.getContainerMiniApp(napDescriptor, miniAppName)
  if (!miniAppString) {
    return log.error(`${miniAppName} MiniApp is not present in ${completeNapDescriptor} container`)
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

    await cauldron.removeMiniAppFromContainer(napDescriptor, Dependency.fromString(miniAppName))

    // Run container generator
    await runCauldronContainerGen(
      napDescriptor,
      cauldronContainerVersion,
      { publish: true })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await cauldron.commitTransaction()

    log.info(`${miniAppString} MiniApp was succesfully removed from ${napDescriptor.toString()}`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to remove ${miniAppString} MiniApp from ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

function ensureValidContainerVersion (version: string) {
  if (/^\d+.\d+.\d+$/.test(version) === false) {
    throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
  }
}

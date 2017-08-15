// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import semver from 'semver'
import {
  runCauldronContainerGen
} from '../../../lib/publication'

exports.command = 'dependency <completeNapDescriptor> <dependency>'
exports.desc = 'Add a native dependency in the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
  })
}

exports.handler = async function ({
  completeNapDescriptor,
  dependency,
  containerVersion
}: {
  completeNapDescriptor: string,
  dependency: string,
  containerVersion?: string
}) {
  if (containerVersion) {
    ensureValidContainerVersion(containerVersion)
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  if (napDescriptor.isPartial) {
    return log.error('You need to provide a complete native application descriptor to this command')
  }

  try {
    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    let cauldronContainerVersion
    if (containerVersion) {
      cauldronContainerVersion = containerVersion
    } else {
      cauldronContainerVersion = await cauldron.getContainerVersion(napDescriptor)
      cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
    }

    // Add the dependency to Cauldron
    await cauldron.addNativeDependency(napDescriptor, Dependency.fromString(dependency))

     // Run container generator
    await runCauldronContainerGen(
      napDescriptor,
      cauldronContainerVersion,
      { publish: true })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await cauldron.commitTransaction()

    log.info(`Dependency ${dependency} was succesfully added to ${napDescriptor.toString()} !`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to add dependency ${dependency} to ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

function ensureValidContainerVersion (version: string) {
  if ((/^\d+.\d+.\d+$/.test(version) === false) && (version !== 'auto')) {
    throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
  }
}

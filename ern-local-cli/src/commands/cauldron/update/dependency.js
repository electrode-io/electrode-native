// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import {
  runCauldronContainerGen
} from '../../../lib/publication'
import semver from 'semver'

exports.command = 'dependency <completeNapDescriptor> <dependency>'
exports.desc = 'Update a native dependency version'

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
} : {
  completeNapDescriptor: string,
  dependency: string,
  containerVersion?: string
}) {
  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)
  const dependencyObj = Dependency.fromString(dependency)

  if (!dependencyObj.isVersioned) {
    return log.error(`You need to provide a versioned dependency`)
  }

  const versionLessDependencyString = dependencyObj.withoutVersion().toString()
  const dependencyObFromCauldron =
    await cauldron.getNativeDependency(napDescriptor, versionLessDependencyString)

  if (!dependencyObFromCauldron) {
    return log.error(`${versionLessDependencyString} dependency was not found in ${napDescriptor.toString()}`)
  }

  if (dependencyObFromCauldron.version === dependencyObj.version) {
    return log.error(`${versionLessDependencyString} dependency is already using version ${dependencyObj.version}`)
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

    await cauldron.updateNativeAppDependency(
      napDescriptor,
      dependencyObj.withoutVersion(),
      dependencyObj.version)

    // Run container generator
    await runCauldronContainerGen(
      napDescriptor,
      cauldronContainerVersion,
      { publish: true })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await cauldron.commitTransaction()

    log.info(`${versionLessDependencyString} dependency version was succesfully updated to ${dependencyObj.version} !`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to update ${versionLessDependencyString} dependency to v${dependencyObj.version}`)
    cauldron.discardTransaction()
  }
}

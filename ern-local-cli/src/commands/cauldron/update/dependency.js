// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'dependency <descriptor> <dependency>'
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
  descriptor,
  dependency,
  containerVersion
} : {
  descriptor: string,
  dependency: string,
  containerVersion?: string
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: dependency
  })

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)
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
    await utils.performContainerStateUpdateInCauldron(async () => {
      await cauldron.updateNativeAppDependency(
        napDescriptor,
        dependencyObj.withoutVersion(),
        dependencyObj.version)
    }, napDescriptor, { containerVersion })
    log.info(`${versionLessDependencyString} dependency version was succesfully updated to ${dependencyObj.version} !`)
  } catch (e) {
    log.error(`An error happened while trying to update ${versionLessDependencyString} dependency to v${dependencyObj.version}`)
  }
}

// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'

exports.command = 'dependency <dependency>'
exports.desc = 'Update a native dependency version'

exports.builder = function (yargs: any) {
  return yargs
    .option('containerVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
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
  dependency,
  containerVersion
} : {
  descriptor?: string,
  dependency: string,
  containerVersion?: string
}) {
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const dependencyObj = Dependency.fromString(dependency)
  if (!dependencyObj.isVersioned) {
    return log.error(`You need to provide a versioned dependency`)
  }

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: dependency,
    dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: { dependency, napDescriptor }
  })

  const versionLessDependencyString = dependencyObj.withoutVersion().toString()

  try {
    await utils.performContainerStateUpdateInCauldron(async () => {
      await cauldron.updateNativeAppDependency(
        napDescriptor,
        dependencyObj.withoutVersion().toString(),
        dependencyObj.version)
    }, napDescriptor, { containerVersion })
    log.info(`${versionLessDependencyString} dependency version was succesfully updated to ${dependencyObj.version} !`)
  } catch (e) {
    log.error(`An error happened while trying to update ${versionLessDependencyString} dependency to v${dependencyObj.version}`)
  }
}

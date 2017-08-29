// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron
} from 'ern-core'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'dependencies <dependencies..>'
exports.desc = 'Update one or more native dependency(ies) version(s)'

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
  dependencies,
  descriptor,
  containerVersion
} : {
  dependencies: Array<string>,
  descriptor?: string,
  containerVersion?: string
}) {
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    napDescriptorExistInCauldron: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: dependencies,
    dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: { dependency: dependencies, napDescriptor }
  })

  try {
    await utils.performContainerStateUpdateInCauldron(async () => {
      for (const dependencyObj of dependenciesObjs) {
        await cauldron.updateNativeAppDependency(
          napDescriptor,
          dependencyObj.withoutVersion().toString(),
          dependencyObj.version)
      }
    }, napDescriptor, { containerVersion })
    log.info(`Dependency(ies) was/were succesfully updated in ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to update dependency(ies) in ${napDescriptor.toString()}`)
  }
}

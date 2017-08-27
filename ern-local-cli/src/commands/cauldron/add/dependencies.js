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
exports.desc = 'Add one or more native dependency(ies) to the Cauldron'

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
  containerVersion,
  descriptor
}: {
  dependencies: Array<string>,
  containerVersion?: string,
  descriptor?: string
}) {
  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }
  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: dependencies,
    napDescriptorExistInCauldron: descriptor,
    dependencyNotInNativeApplicationVersionContainer: { dependency: dependencies, napDescriptor }
  })

  const dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))

  try {
    await utils.performContainerStateUpdateInCauldron(async () => {
      for (const dependencyObj of dependenciesObjs) {
        // Add the dependency to Cauldron
        await cauldron.addNativeDependency(napDescriptor, dependencyObj)
      }
    }, napDescriptor, { containerVersion })
    log.info(`Dependency(ies) was/were succesfully added to ${napDescriptor.toString()} !`)
  } catch (e) {
    log.error(`An error happened while trying to add a dependency to ${napDescriptor.toString()}`)
  }
}

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

exports.command = 'dependency [dependency]'
exports.desc = 'Add one or more native dependency(ies) to the Cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
  })
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force adding the dependency(ies) (if you really know what you\'re doing)'
  })
  .option('descriptor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
  .option('dependencies', {
    type: 'array',
    describe: 'One or more dependencies'
  })
}

exports.handler = async function ({
  dependency,
  dependencies,
  descriptor,
  containerVersion,
  force
}: {
  dependency?: string,
  dependencies?: Array<string>,
  descriptor?: string,
  containerVersion?: string,
  force?: boolean
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    isCompleteNapDescriptorString: descriptor,
    isValidContainerVersion: containerVersion,
    noGitOrFilesystemPath: dependency || dependencies,
    napDescriptorExistInCauldron: descriptor
  })

  if (!descriptor) {
    descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

  const dependenciesObjs = dependency
  ? [ Dependency.fromString(dependency) ]
  : _.map(dependencies, d => Dependency.fromString(d))

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

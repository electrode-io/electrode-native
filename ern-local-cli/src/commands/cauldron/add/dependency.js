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
import Ensure from '../../../lib/Ensure'
import utils from '../../../lib/utils'
import _ from 'lodash'
import inquirer from 'inquirer'

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
  .option('completeNapDescritor', {
    type: 'string',
    alias: 'd',
    describe: 'A complete native application descriptor'
  })
  .option('completeNapDescritor', {
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
  completeNapDescriptor,
  containerVersion,
  force
}: {
  dependency?: string,
  dependencies?: Array<string>,
  completeNapDescriptor?: string,
  containerVersion?: string,
  force?: boolean
}) {
  if (containerVersion) {
    Ensure.isValidContainerVersion(containerVersion)
  }
  if (completeNapDescriptor) {
    Ensure.isCompleteNapDescriptorString(completeNapDescriptor)
  }
  Ensure.noGitOrFilesystemPath(dependency || dependencies)

  //
  // If no 'completeNapDescriptor' was provided, list all non released
  // native application versions from the Cauldron, so that user can
  // choose one of them to add the MiniApp(s) to
  if (!completeNapDescriptor) {
    const napDescriptorStrings = utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true })

    const { userSelectedCompleteNapDescriptor } = await inquirer.prompt([{
      type: 'list',
      name: 'userSelectedCompleteNapDescriptor',
      message: 'Choose a non released native application version to which you want to add this/these dependency(ies)',
      choices: napDescriptorStrings
    }])

    completeNapDescriptor = userSelectedCompleteNapDescriptor
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  const dependenciesObjs = dependency
  ? [ Dependency.fromString(dependency) ]
  : _.map(dependencies, d => Dependency.fromString(d))

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

    for (const dependencyObj of dependenciesObjs) {
      // Add the dependency to Cauldron
      await cauldron.addNativeDependency(napDescriptor, dependencyObj)
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

    log.info(`Dependency(ies) was/were succesfully added to ${napDescriptor.toString()} !`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to add a dependency to ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

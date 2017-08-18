// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron,
  dependencyLookup
} from 'ern-core'
import {
  runCauldronContainerGen
} from '../../../lib/publication'
import Ensure from '../../../lib/Ensure'
import utils from '../../../lib/utils'
import _ from 'lodash'
import semver from 'semver'
import inquirer from 'inquirer'

exports.command = 'dependency [dependency]'
exports.desc = 'Remove one or more dependency(ies) from the cauldron'

exports.builder = function (yargs: any) {
  return yargs
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force publish'
  })
  .option('containerVersion', {
    alias: 'v',
    type: 'string',
    describe: 'Version to use for generated container. If none provided, patch version will be bumped by default.'
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
  completeNapDescriptor,
  dependency,
  dependencies,
  force,
  containerVersion
} : {
  completeNapDescriptor?: string,
  dependency?: string,
  dependencies?: Array<string>,
  force?: boolean,
  containerVersion?: string
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

  // First let's figure out if any of the MiniApps are using this/these dependency(ies)
  // to make sure that we don't remove any dependency currently used by any MiniApp
  const miniApps = await cauldron.getContainerMiniApps(napDescriptor)
  const miniAppsPaths = _.map(miniApps, m => m.path)
  if (!force) {
    for (const dependencyObj of dependenciesObjs) {
      const miniAppsUsingDependency = await dependencyLookup.getMiniAppsUsingNativeDependency(miniAppsPaths, dependencyObj)
      if (miniAppsUsingDependency && miniAppsUsingDependency.length > 0) {
        log.error(`The following MiniApp(s) are using this dependency`)
        for (const miniApp of miniAppsUsingDependency) {
          log.error(`=> ${miniApp.name}`)
        }
        log.error(`You cannot remove a native dependency that is being used by at least a MiniApp`)
        log.error(`To properly remove this native dependency, you cant either :'`)
        log.error(`- Remove the native dependency from the MiniApp(s) that are using it`)
        log.error(`- Remove the MiniApps that are using this dependency`)
        log.error(`- Provide the force flag to this command (if you really now what you're doing)`)
        return
      }
    }
  }

  // OK, no MiniApp are currently using this/these dependency(ies), it is safe to remove it/them
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

    for (const dependencyObj of dependenciesObjs) {
      await cauldron.removeNativeDependency(napDescriptor, dependencyObj)
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

    log.info(`Dependency(ies) was/were succesfully removed from ${napDescriptor.toString()}`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to remove dependency(ies) from ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

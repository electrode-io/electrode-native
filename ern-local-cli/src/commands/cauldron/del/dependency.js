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
import _ from 'lodash'
import semver from 'semver'

exports.command = 'dependency <completeNapDescriptor> <dependency>'
exports.desc = 'Remove a dependency from the cauldron'

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
}

exports.handler = async function ({
  completeNapDescriptor,
  dependency,
  force,
  containerVersion
} : {
  completeNapDescriptor: string,
  dependency: string,
  force?: boolean,
  containerVersion?: string
}) {
  if (containerVersion) {
    ensureValidContainerVersion(containerVersion)
  }

  const napDescriptor = NativeApplicationDescriptor.fromString(completeNapDescriptor)

  // First let's figure out if any of the MiniApps are using this dependency
  // to make sure that we don't remove a dependency used by any MiniApp
  const miniApps = await cauldron.getContainerMiniApps(napDescriptor)
  const miniAppsPaths = _.map(miniApps, m => m.path)
  const miniAppsUsingDependency = await dependencyLookup.getMiniAppsUsingNativeDependency(miniAppsPaths, Dependency.fromString(dependency))
  if (!force && miniAppsUsingDependency && miniAppsUsingDependency.length > 0) {
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

  // OK, no MiniApp are currently using this dependency, it is safe to remove it
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

    await cauldron.removeNativeDependency(napDescriptor, Dependency.fromString(dependency))

    // Run container generator
    await runCauldronContainerGen(
      napDescriptor,
      cauldronContainerVersion,
      { publish: true })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(napDescriptor, cauldronContainerVersion)

    // Commit Cauldron transaction
    await cauldron.commitTransaction()

    log.info(`${dependency} dependency was succesfully removed from ${napDescriptor.toString()}`)
    log.info(`Published new container version ${cauldronContainerVersion} for ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to remove ${dependency} from ${napDescriptor.toString()}`)
    cauldron.discardTransaction()
  }
}

function ensureValidContainerVersion (version: string) {
  if (/^\d+.\d+.\d+$/.test(version) === false) {
    throw new Error(`Invalid version (${version}) for container. Please use a valid version in the form x.y.z`)
  }
}

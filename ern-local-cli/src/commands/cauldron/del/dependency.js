// @flow

import {
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import {
  cauldron,
  dependencyLookup
} from 'ern-core'
import utils from '../../../lib/utils'
import _ from 'lodash'

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
  descriptor,
  dependency,
  dependencies,
  force,
  containerVersion
} : {
  descriptor?: string,
  dependency?: string,
  dependencies?: Array<string>,
  force?: boolean,
  containerVersion?: string
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
    await utils.performContainerStateUpdateInCauldron(async () => {
      for (const dependencyObj of dependenciesObjs) {
        await cauldron.removeNativeDependency(napDescriptor, dependencyObj)
      }
    }, napDescriptor, { containerVersion })
    log.info(`Dependency(ies) was/were succesfully removed from ${napDescriptor.toString()}`)
  } catch (e) {
    log.error(`An error happened while trying to remove dependency(ies) from ${napDescriptor.toString()}`)
  }
}

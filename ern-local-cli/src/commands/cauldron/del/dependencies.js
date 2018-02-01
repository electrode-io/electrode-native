// @flow

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils
} from 'ern-core'
import utils from '../../../lib/utils'
import _ from 'lodash'

exports.command = 'dependencies <dependencies..>'
exports.desc = 'Remove one or more dependency(ies) from the cauldron'

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
  .option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Force publish'
  })
  .epilog(utils.epilog(exports))
}

exports.handler = async function ({
  dependencies,
  containerVersion,
  descriptor,
  force
} : {
  dependencies: Array<string>,
  descriptor?: string,
  containerVersion?: string,
  force?: boolean
}) {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage: 'A Cauldron must be active in order to use this command'
    }
  })
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({ onlyNonReleasedVersions: true })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      isValidContainerVersion: containerVersion ? { containerVersion } : undefined,
      isNewerContainerVersion: containerVersion ? {
        containerVersion,
        descriptor,
        extraErrorMessage: 'To avoid conflicts with previous versions, you can only use container version newer than the current one'
      } : undefined,
      noGitOrFilesystemPath: {
        obj: dependencies,
        extraErrorMessage: 'You cannot provide dependency(ies) using git or file schme for this command. Only the form dependency@version is allowed.'
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: dependencies,
        napDescriptor,
        extraErrorMessahe: 'This command cannot remove dependency(ies) that do not exist in Cauldron.'
      },
      dependencyNotInUseByAMiniApp: {
        dependency: dependencies,
        napDescriptor
      }
    })

    const dependenciesObjs: Array<PackagePath> = _.map(dependencies, PackagePath.fromString)

    const cauldronCommitMessage = [
      `${dependencies.length === 1
      ? `Remove ${dependencies[0]} native dependency from ${napDescriptor.toString()}`
      : `Remove multiple native dependencies from ${napDescriptor.toString()}`}`
    ]

    const cauldron = await coreUtils.getCauldronInstance()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const dependencyObj: PackagePath of dependenciesObjs) {
          await cauldron.removeContainerNativeDependency(napDescriptor, dependencyObj)
          cauldronCommitMessage.push(`- Remove ${dependencyObj.toString()} native dependency`)
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.info(`Dependency(ies) was/were succesfully removed from ${napDescriptor.toString()}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

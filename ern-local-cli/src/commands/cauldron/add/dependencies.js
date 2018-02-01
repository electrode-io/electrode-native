// @flow

import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils
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
        extraErrorMessage: 'You cannot provide dependencies using git or file schme for this command. Only the form dependency@version is allowed.'
      },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
      dependencyNotInNativeApplicationVersionContainer: {
        dependency: dependencies,
        napDescriptor,
        extraErrorMessage: 'If you want to update dependency(ies) version(s), use -ern cauldron update dependencies- instead'
      },
      publishedToNpm: {
        obj: dependencies,
        extraErrorMessage: 'You can only add dependencies versions that have been published to NPM'
      }
    })

    const dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))

    const cauldronCommitMessage = [
      `${dependencies.length === 1
      ? `Add ${dependencies[0]} native dependency to ${napDescriptor.toString()}`
      : `Add multiple native dependencies to ${napDescriptor.toString()}`}`
    ]

    const cauldron = await coreUtils.getCauldronInstance()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const dependencyObj of dependenciesObjs) {
          // Add the dependency to Cauldron
          await cauldron.addContainerNativeDependency(napDescriptor, dependencyObj)
          cauldronCommitMessage.push(`- Add ${dependencyObj.toString()} native dependency`)
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.info(`Dependency(ies) was/were succesfully added to ${napDescriptor.toString()} !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

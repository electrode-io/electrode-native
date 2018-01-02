// @flow

import {
  Dependency,
  NativeApplicationDescriptor,
  utils as coreUtils
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

    const dependenciesObjs = _.map(dependencies, d => Dependency.fromString(d))

    await utils.logErrorAndExitIfNotSatisfied({
      isCompleteNapDescriptorString: { descriptor },
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage: 'This command cannot work on a non existing native application version'
      },
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
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: dependencies,
        napDescriptor,
        extraErrorMessage: 'If you want to add a new dependency(ies), use -ern cauldron add dependencies- instead'
      },
      dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: {
        dependency: dependencies,
        napDescriptor,
        extraErrorMessage: 'It seems like you are trying to update a dependency to a version that is already the one in use.'
      }
    })

    const cauldronCommitMessage = [
      `${dependenciesObjs.length === 1
      ? `Update ${dependenciesObjs[0].withoutVersion().toString()} native dependency version in v${napDescriptor.toString()}`
      : `Update multiple native dependencies versions in ${napDescriptor.toString()}`}`
    ]

    const cauldron = await coreUtils.getCauldronInstance()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const dependencyObj of dependenciesObjs) {
          await cauldron.updateNativeAppDependency(
            napDescriptor,
            dependencyObj.withoutVersion().toString(),
            dependencyObj.version)
          cauldronCommitMessage.push(`- Update ${dependencyObj.withoutVersion().toString()} native dependency to v${dependencyObj.version}`)
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion })
    log.info(`Dependency(ies) was/were succesfully updated in ${napDescriptor.toString()}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

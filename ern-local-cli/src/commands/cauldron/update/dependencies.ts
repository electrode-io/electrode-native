import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import utils from '../../../lib/utils'
import _ from 'lodash'
import { Argv } from 'yargs'

export const command = 'dependencies <dependencies..>'
export const desc = 'Update one or more native dependency(ies) version(s)'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe:
        'Version to use for generated container. If none provided, patch version will be bumped by default.',
      type: 'string',
    })
    .option('descriptor', {
      alias: 'd',
      describe: 'A complete native application descriptor',
      type: 'string',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  dependencies,
  descriptor,
  containerVersion,
}: {
  dependencies: string[]
  descriptor?: string
  containerVersion?: string
}) => {
  await utils.logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })
  try {
    if (!descriptor) {
      descriptor = await utils.askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      })
    }
    const napDescriptor = NativeApplicationDescriptor.fromString(descriptor)

    const dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))

    await utils.logErrorAndExitIfNotSatisfied({
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: dependencies,
        extraErrorMessage:
          'If you want to add a new dependency(ies), use -ern cauldron add dependencies- instead',
        napDescriptor,
      },
      dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: {
        dependency: dependencies,
        extraErrorMessage:
          'It seems like you are trying to update a dependency to a version that is already the one in use.',
        napDescriptor,
      },
      isCompleteNapDescriptorString: { descriptor },
      isNewerContainerVersion: containerVersion
        ? {
            containerVersion,
            descriptor,
            extraErrorMessage:
              'To avoid conflicts with previous versions, you can only use container version newer than the current one',
          }
        : undefined,
      isValidContainerVersion: containerVersion
        ? { containerVersion }
        : undefined,
      napDescriptorExistInCauldron: {
        descriptor,
        extraErrorMessage:
          'This command cannot work on a non existing native application version',
      },
      noGitOrFilesystemPath: {
        extraErrorMessage:
          'You cannot provide dependencies using git or file schme for this command. Only the form dependency@version is allowed.',
        obj: dependencies,
      },
    })

    const cauldronCommitMessage = [
      `${
        dependenciesObjs.length === 1
          ? `Update ${
              dependenciesObjs[0].basePath
            } native dependency version in v${napDescriptor.toString()}`
          : `Update multiple native dependencies versions in ${napDescriptor.toString()}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const dependencyObj of dependenciesObjs) {
          await cauldron.updateContainerNativeDependencyVersion(
            napDescriptor,
            dependencyObj.basePath,
            dependencyObj.version
          )
          cauldronCommitMessage.push(
            `- Update ${dependencyObj.basePath} native dependency to v${
              dependencyObj.version
            }`
          )
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(
      `Dependency(ies) was/were succesfully updated in ${napDescriptor.toString()}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

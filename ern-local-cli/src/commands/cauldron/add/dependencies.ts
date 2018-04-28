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
export const desc = 'Add one or more native dependency(ies) to the Cauldron'

export const builder = (argv: Argv) => {
  return argv
    .option('containerVersion', {
      alias: 'v',
      describe: 'Version to use for generated container (default: bump patch)',
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
  containerVersion,
  descriptor,
}: {
  dependencies: string[]
  containerVersion?: string
  descriptor?: string
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

    await utils.logErrorAndExitIfNotSatisfied({
      dependencyNotInNativeApplicationVersionContainer: {
        dependency: dependencies,
        extraErrorMessage:
          'If you want to update dependency(ies) version(s), use -ern cauldron update dependencies- instead',
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
      publishedToNpm: {
        extraErrorMessage:
          'You can only add dependencies versions that have been published to NPM',
        obj: dependencies,
      },
    })

    const dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))

    const cauldronCommitMessage = [
      `${
        dependencies.length === 1
          ? `Add ${
              dependencies[0]
            } native dependency to ${napDescriptor.toString()}`
          : `Add multiple native dependencies to ${napDescriptor.toString()}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        for (const dependencyObj of dependenciesObjs) {
          // Add the dependency to Cauldron
          await cauldron.addContainerNativeDependency(
            napDescriptor,
            dependencyObj
          )
          cauldronCommitMessage.push(
            `- Add ${dependencyObj.toString()} native dependency`
          )
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(
      `Dependency(ies) was/were succesfully added to ${napDescriptor.toString()} !`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

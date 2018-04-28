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
export const desc = 'Remove one or more dependency(ies) from the cauldron'

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
    .option('force', {
      alias: 'f',
      describe: 'Force publish',
      type: 'boolean',
    })
    .epilog(utils.epilog(exports))
}

export const handler = async ({
  dependencies,
  containerVersion,
  descriptor,
  force,
}: {
  dependencies: string[]
  descriptor?: string
  containerVersion?: string
  force?: boolean
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
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: dependencies,
        extraErrorMessage:
          'This command cannot remove dependency(ies) that do not exist in Cauldron.',
        napDescriptor,
      },
      dependencyNotInUseByAMiniApp: {
        dependency: dependencies,
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
          'You cannot provide dependency(ies) using git or file schme for this command. Only the form dependency@version is allowed.',
        obj: dependencies,
      },
    })

    const dependenciesObjs: PackagePath[] = _.map(
      dependencies,
      PackagePath.fromString
    )

    const cauldronCommitMessage = [
      `${
        dependencies.length === 1
          ? `Remove ${
              dependencies[0]
            } native dependency from ${napDescriptor.toString()}`
          : `Remove multiple native dependencies from ${napDescriptor.toString()}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await utils.performContainerStateUpdateInCauldron(
      async () => {
        let dependencyObj: PackagePath
        for (dependencyObj of dependenciesObjs) {
          await cauldron.removeContainerNativeDependency(
            napDescriptor,
            dependencyObj
          )
          cauldronCommitMessage.push(
            `- Remove ${dependencyObj.toString()} native dependency`
          )
        }
      },
      napDescriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(
      `Dependency(ies) was/were succesfully removed from ${napDescriptor.toString()}`
    )
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

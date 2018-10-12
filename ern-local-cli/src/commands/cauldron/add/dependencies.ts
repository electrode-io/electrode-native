import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  log,
} from 'ern-core'
import { performContainerStateUpdateInCauldron } from 'ern-orchestrator'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
} from '../../../lib'
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
    .coerce('dependencies', d => d.map(PackagePath.fromString))
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

export const handler = async ({
  dependencies,
  containerVersion,
  descriptor,
}: {
  dependencies: PackagePath[]
  containerVersion?: string
  descriptor?: NativeApplicationDescriptor
}) => {
  try {
    descriptor =
      descriptor ||
      (await askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      }))!

    await logErrorAndExitIfNotSatisfied({
      cauldronIsActive: {
        extraErrorMessage:
          'A Cauldron must be active in order to use this command',
      },
      dependencyNotInNativeApplicationVersionContainer: {
        dependency: dependencies,
        descriptor,
        extraErrorMessage:
          'If you want to update dependency(ies) version(s), use -ern cauldron update dependencies- instead',
      },
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
          'You cannot provide dependencies using git or file scheme for this command. Only the form dependency@version is allowed.',
        obj: dependencies,
      },
      publishedToNpm: {
        extraErrorMessage:
          'You can only add dependencies versions that have been published to NPM',
        obj: dependencies,
      },
    })

    const cauldronCommitMessage = [
      `${
        dependencies.length === 1
          ? `Add ${dependencies[0]} native dependency to ${descriptor}`
          : `Add multiple native dependencies to ${descriptor}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        for (const dependency of dependencies) {
          // Add the dependency to Cauldron
          await cauldron.addContainerNativeDependency(descriptor!, dependency)
          cauldronCommitMessage.push(`- Add ${dependency} native dependency`)
        }
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(`Dependency(ies) was/were succesfully added to ${descriptor} !`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

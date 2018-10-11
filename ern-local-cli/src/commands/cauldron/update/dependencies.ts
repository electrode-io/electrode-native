import {
  PackagePath,
  NativeApplicationDescriptor,
  utils as coreUtils,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { performContainerStateUpdateInCauldron } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
} from '../../../lib'
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
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .epilog(epilog(exports))
}

export const handler = async ({
  dependencies,
  descriptor,
  containerVersion,
}: {
  dependencies: string[]
  descriptor?: NativeApplicationDescriptor
  containerVersion?: string
}) => {
  await logErrorAndExitIfNotSatisfied({
    cauldronIsActive: {
      extraErrorMessage:
        'A Cauldron must be active in order to use this command',
    },
  })
  try {
    descriptor =
      descriptor ||
      (await askUserToChooseANapDescriptorFromCauldron({
        onlyNonReleasedVersions: true,
      }))

    const dependenciesObjs = _.map(dependencies, d => PackagePath.fromString(d))
    const versionLessDependencies = _.filter(dependenciesObjs, d => !d.version)
    if (versionLessDependencies.length > 0) {
      throw new Error(
        `You need to specify a version to upgrade each dependency to.
The following dependencies are missing a version : ${versionLessDependencies.toString()}`
      )
    }

    await logErrorAndExitIfNotSatisfied({
      dependencyIsInNativeApplicationVersionContainer: {
        dependency: dependencies,
        descriptor,
        extraErrorMessage:
          'If you want to add a new dependency(ies), use -ern cauldron add dependencies- instead',
      },
      dependencyIsInNativeApplicationVersionContainerWithDifferentVersion: {
        dependency: dependencies,
        descriptor,
        extraErrorMessage:
          'It seems like you are trying to update a dependency to a version that is already the one in use.',
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
          'You cannot provide dependencies using git or file schme for this command. Only the form dependency@version is allowed.',
        obj: dependencies,
      },
    })

    const cauldronCommitMessage = [
      `${
        dependenciesObjs.length === 1
          ? `Update ${
              dependenciesObjs[0].basePath
            } native dependency version in v${descriptor}`
          : `Update multiple native dependencies versions in ${descriptor}`
      }`,
    ]

    const cauldron = await getActiveCauldron()
    await performContainerStateUpdateInCauldron(
      async () => {
        for (const dependencyObj of dependenciesObjs) {
          await cauldron.updateContainerNativeDependencyVersion(
            descriptor!,
            dependencyObj.basePath,
            dependencyObj.version!
          )
          cauldronCommitMessage.push(
            `- Update ${dependencyObj.basePath} native dependency to v${
              dependencyObj.version
            }`
          )
        }
      },
      descriptor,
      cauldronCommitMessage,
      { containerVersion }
    )
    log.info(`Dependency(ies) was/were succesfully updated in ${descriptor}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}

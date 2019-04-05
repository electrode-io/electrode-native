import { PackagePath, NativeApplicationDescriptor, log } from 'ern-core'
import { syncCauldronContainer } from 'ern-orchestrator'
import { getActiveCauldron } from 'ern-cauldron-api'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
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
    .coerce('descriptor', d =>
      NativeApplicationDescriptor.fromString(d, { throwIfNotComplete: true })
    )
    .coerce('dependencies', d => d.map(PackagePath.fromString))
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  containerVersion,
  dependencies,
  descriptor,
}: {
  containerVersion?: string
  dependencies: PackagePath[]
  descriptor?: NativeApplicationDescriptor
}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))!

  await logErrorAndExitIfNotSatisfied({
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
  await syncCauldronContainer(
    async () => {
      for (const dependency of dependencies) {
        await cauldron.addNativeDependencyToContainer(descriptor!, dependency)
        cauldronCommitMessage.push(`- Add ${dependency} native dependency`)
      }
    },
    descriptor,
    cauldronCommitMessage,
    { containerVersion }
  )
  log.info(`Dependency(ies) successfully added to ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

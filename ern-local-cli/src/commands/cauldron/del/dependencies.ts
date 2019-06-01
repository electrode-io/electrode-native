import { PackagePath, AppVersionDescriptor, log } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { syncCauldronContainer } from 'ern-orchestrator'
import {
  epilog,
  logErrorAndExitIfNotSatisfied,
  askUserToChooseANapDescriptorFromCauldron,
  tryCatchWrap,
} from '../../../lib'
import _ from 'lodash'
import { Argv } from 'yargs'
import { utils } from 'ern-core/dist'

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
    .coerce('descriptor', (d: string) => AppVersionDescriptor.fromString(d))
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
  descriptor?: AppVersionDescriptor
}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
    dependencyIsInNativeApplicationVersionContainer: {
      dependency: dependencies,
      descriptor,
      extraErrorMessage:
        'This command cannot remove dependency(ies) that do not exist in Cauldron.',
    },
    dependencyNotInUseByAMiniApp: {
      dependency: dependencies,
      descriptor,
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
        'You cannot provide dependency(ies) using git or file schme for this command. Only the form dependency@version is allowed.',
      obj: dependencies,
    },
  })

  const cauldronCommitMessage = [
    `${
      dependencies.length === 1
        ? `Remove ${dependencies[0]} native dependency from ${descriptor}`
        : `Remove multiple native dependencies from ${descriptor}`
    }`,
  ]

  const cauldron = await getActiveCauldron()
  await syncCauldronContainer(
    async () => {
      for (const dependency of dependencies) {
        await cauldron.removeNativeDependencyFromContainer(
          descriptor!,
          dependency
        )
        cauldronCommitMessage.push(`- Remove ${dependency} native dependency`)
      }
    },
    descriptor,
    cauldronCommitMessage,
    { containerVersion }
  )
  log.info(`Dependency(ies) successfully removed from ${descriptor}`)
}

export const handler = tryCatchWrap(commandHandler)

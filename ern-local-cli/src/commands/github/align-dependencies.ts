import { getActiveCauldron } from 'ern-cauldron-api'
import { log, AppVersionDescriptor, PackagePath } from 'ern-core'
import { alignPackageJsonOnManifest, getGitHubApi } from 'ern-orchestrator'
import {
  askUserToChooseANapDescriptorFromCauldron,
  epilog,
  logErrorAndExitIfNotSatisfied,
  tryCatchWrap,
} from '../../lib'
import { Argv } from 'yargs'

export const command = 'align-dependencies'
export const desc =
  'Align dependencies of all GitHub based packages on a manifest id'

export const builder = (argv: Argv) => {
  return argv
    .option('descriptor', {
      describe: 'Native application version containing the packages to upgrade',
      type: 'string',
    })
    .coerce('descriptor', d => AppVersionDescriptor.fromString(d))
    .option('manifestId', {
      default: 'default',
      describe:
        'Id of the manifest entry to use to retrieve versions to upgrade to',
      type: 'string',
    })
    .epilog(epilog(exports))
}

export const commandHandler = async ({
  descriptor,
  manifestId = 'default',
}: {
  descriptor?: AppVersionDescriptor
  manifestId?: string
} = {}) => {
  descriptor =
    descriptor ||
    (await askUserToChooseANapDescriptorFromCauldron({
      onlyNonReleasedVersions: true,
    }))

  await logErrorAndExitIfNotSatisfied({
    isEnvVariableDefined: {
      extraErrorMessage:
        'ERN_GITHUB_TOKEN environment variable must be set, to use `ern github` commands',
      name: 'ERN_GITHUB_TOKEN',
    },
    manifestIdExists: {
      id: manifestId,
    },
    napDescriptorExistInCauldron: {
      descriptor,
      extraErrorMessage:
        'This command cannot work on a non existing native application version',
    },
  })

  const cauldron = await getActiveCauldron()

  const packages: PackagePath[] = await cauldron.getContainerMiniAppsBranches(
    descriptor
  )

  await alignPackageJsonOnManifest({ manifestId, packages })
}

export const handler = tryCatchWrap(commandHandler)

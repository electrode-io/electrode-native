import { CauldronHelper } from './CauldronHelper'
import { config, Platform } from 'ern-core'
import { getCurrentSchemaVersion } from './util'
import semver from 'semver'
import { defaultCauldron } from './CauldronApiFactory'
import path from 'path'

// Singleton CauldronHelper
// Returns undefined if no Cauldron is active
// Throw error if Cauldron is not using the correct schema version
let currentCauldronHelperInstance
let currentCauldronRepoInUse

export default async function getActiveCauldron({
  ignoreSchemaVersionMismatch,
}: {
  ignoreSchemaVersionMismatch?: boolean
} = {}): Promise<CauldronHelper> {
  const repoInUse = config.getValue('cauldronRepoInUse')
  if (repoInUse && repoInUse !== currentCauldronRepoInUse) {
    const cauldronRepositories = config.getValue('cauldronRepositories')
    const cauldronRepoUrl = cauldronRepositories[repoInUse]
    const cauldronRepoBranchReResult = /#(.+)$/.exec(cauldronRepoUrl)
    const cauldronRepoUrlWithoutBranch = cauldronRepoUrl.replace(/#(.+)$/, '')
    const cauldronCli = defaultCauldron(
      cauldronRepoUrlWithoutBranch,
      path.join(Platform.rootDirectory, 'cauldron'),
      cauldronRepoBranchReResult ? cauldronRepoBranchReResult[1] : 'master'
    )
    currentCauldronHelperInstance = new CauldronHelper(cauldronCli)
    const schemaVersionUsedByCauldron = await currentCauldronHelperInstance.getCauldronSchemaVersion()
    const schemaVersionOfCurrentCauldronApi = getCurrentSchemaVersion()
    if (
      !ignoreSchemaVersionMismatch &&
      schemaVersionUsedByCauldron !== schemaVersionOfCurrentCauldronApi
    ) {
      if (
        semver.gt(
          schemaVersionUsedByCauldron,
          schemaVersionOfCurrentCauldronApi
        )
      ) {
        throw new Error(
          `Cauldron schema version mismatch (${schemaVersionUsedByCauldron} > ${schemaVersionOfCurrentCauldronApi}).
You should switch to a newer platform version that supports this Cauldron schema.`
        )
      } else if (
        semver.lt(
          schemaVersionUsedByCauldron,
          schemaVersionOfCurrentCauldronApi
        )
      ) {
        throw new Error(
          `Cauldron schema version mismatch (${schemaVersionUsedByCauldron} < ${schemaVersionOfCurrentCauldronApi}.
You should run the following command : 'ern cauldron upgrade' to upgrade your Cauldron to the latest version.
You can also switch to an older version of the platform which supports this Cauldron schema version.`
        )
      }
    }
    currentCauldronRepoInUse = repoInUse
  }

  return Promise.resolve(currentCauldronHelperInstance)
}

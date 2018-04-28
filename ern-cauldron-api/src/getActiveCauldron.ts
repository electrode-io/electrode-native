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
export default async function getActiveCauldron({
  ignoreSchemaVersionMismatch,
}: {
  ignoreSchemaVersionMismatch?: boolean
} = {}): Promise<CauldronHelper> {
  if (!currentCauldronHelperInstance) {
    const cauldronRepositories = config.getValue('cauldronRepositories')
    const cauldronRepoInUse = config.getValue('cauldronRepoInUse')
    if (cauldronRepoInUse) {
      const cauldronRepoUrl = cauldronRepositories[cauldronRepoInUse]
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
    }
  }
  return Promise.resolve(currentCauldronHelperInstance)
}

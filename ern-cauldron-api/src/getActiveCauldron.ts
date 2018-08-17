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
  ignoreElectrodeNativeVersionMismatch,
}: {
  ignoreSchemaVersionMismatch?: boolean
  ignoreElectrodeNativeVersionMismatch?: boolean
} = {}): Promise<CauldronHelper> {
  const repoInUse = config.getValue('cauldronRepoInUse')
  if (repoInUse && repoInUse !== currentCauldronRepoInUse) {
    const cauldronRepositories = config.getValue('cauldronRepositories')
    const cauldronRepoUrl = cauldronRepositories[repoInUse]
    const cauldronRepoBranchReResult = /#(.+)$/.exec(cauldronRepoUrl)
    const cauldronRepoUrlWithoutBranch = cauldronRepoUrl.replace(/#(.+)$/, '')
    const cauldronCli = defaultCauldron({
      branch: cauldronRepoBranchReResult
        ? cauldronRepoBranchReResult[1]
        : 'master',
      cauldronPath: path.isAbsolute(cauldronRepoUrl)
        ? cauldronRepoUrl
        : path.join(Platform.rootDirectory, 'cauldron'),
      repository: path.isAbsolute(cauldronRepoUrl)
        ? undefined
        : cauldronRepoUrlWithoutBranch,
    })
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
    const ernVersionEnforcedByCauldron = await currentCauldronHelperInstance.getElectrodeNativeVersion()
    if (ernVersionEnforcedByCauldron && !ignoreElectrodeNativeVersionMismatch) {
      if (
        semver.neq(ernVersionEnforcedByCauldron, Platform.currentVersion) &&
        Platform.currentVersion !== '10000.0.0'
      ) {
        if (semver.gt(ernVersionEnforcedByCauldron, Platform.currentVersion)) {
          throw new Error(
            `The Cauldron is enforcing the use of Electrode Native v${ernVersionEnforcedByCauldron}.
However you are using version ${Platform.currentVersion} of Electrode Native.
If you want to use this Cauldron, please run 'ern platform use ${ernVersionEnforcedByCauldron}' and try again.`
          )
        } else {
          throw new Error(`The Cauldron is enforcing the use of Electrode Native v${ernVersionEnforcedByCauldron}.
However you are using version ${Platform.currentVersion} of Electrode Native.
If you want to use this Cauldron with this version of Electrode Native, you will have to update the version of Electrode Native
enforced by this Cauldron, by running this command 'ern cauldron update ernversion --version ${
            Platform.currentVersion
          }'.
Please be aware that this will enforce this version of Electrode Native to be used by all clients of the Cauldron.`)
        }
      }
    }
    currentCauldronRepoInUse = repoInUse
  }

  return Promise.resolve(currentCauldronHelperInstance)
}

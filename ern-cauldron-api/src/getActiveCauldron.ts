import { CauldronHelper } from './CauldronHelper'
import { config, kax, Platform, utils } from 'ern-core'
import { getCurrentSchemaVersion } from './util'
import semver from 'semver'
import { defaultCauldron } from './CauldronApiFactory'
import path from 'path'

// Singleton CauldronHelper
// Returns undefined if no Cauldron is active
// Throw error if Cauldron is not using the correct schema version
let currentCauldronHelperInstance
let currentCauldronRepoInUse
const ernPlatformUseCmdMsg = 'ern platform use <version> command'

export default async function getActiveCauldron({
  ignoreRequiredErnVersionMismatch,
  ignoreSchemaVersionMismatch,
  localRepoPath,
  throwIfNoActiveCauldron = true,
}: {
  ignoreRequiredErnVersionMismatch?: boolean
  ignoreSchemaVersionMismatch?: boolean
  localRepoPath?: string
  throwIfNoActiveCauldron?: boolean
} = {}): Promise<CauldronHelper> {
  const repoInUse = config.getValue('cauldronRepoInUse')
  ignoreRequiredErnVersionMismatch =
    ignoreRequiredErnVersionMismatch ||
    config.getValue('ignore-required-ern-version') ||
    process.env.ERN_IGNORE_REQUIRED_ERN_VERSION
  if (!repoInUse && throwIfNoActiveCauldron) {
    throw new Error('No active Cauldron')
  }
  let kaxTask
  try {
    if (repoInUse && repoInUse !== currentCauldronRepoInUse) {
      kaxTask = kax.task(`Connecting to the Cauldron`)
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
          : localRepoPath || Platform.cauldronDirectory,
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
              You should switch to a newer Electrode Native version that supports this Cauldron schema using ${ernPlatformUseCmdMsg}`
          )
        } else if (
          semver.lt(
            schemaVersionUsedByCauldron,
            schemaVersionOfCurrentCauldronApi
          )
        ) {
          throw new Error(
            `Cauldron schema version mismatch (${schemaVersionUsedByCauldron} < ${schemaVersionOfCurrentCauldronApi}.
              You can upgrade your Cauldron to the latest version using 'ern cauldron upgrade' command.
              You can switch to an older version of the Electrode Native which supports this Cauldron schema version using ${ernPlatformUseCmdMsg}`
          )
        }
      }
      if (!ignoreRequiredErnVersionMismatch) {
        const requiredErnVersion = await currentCauldronHelperInstance.getConfigForKey(
          'requiredErnVersion'
        )
        if (requiredErnVersion) {
          if (!semver.satisfies(Platform.currentVersion, requiredErnVersion)) {
            throw new Error(
              `This Cauldron requires a specific version of Electrode Native to be used. 
                You are currently using Electrode Native version ${
                  Platform.currentVersion
                } which does not satifisy version requirement of ${requiredErnVersion}.
                You should use a version of Electrode Native that satisfies the Cauldron requirement using ${ernPlatformUseCmdMsg} or use a different Cauldron.`
            )
          }
        }
      }
      currentCauldronRepoInUse = repoInUse
      kaxTask.succeed()
    }
  } catch (e) {
    kaxTask.fail()
    utils.logErrorAndExitProcess(e, 1)
  }

  return Promise.resolve(currentCauldronHelperInstance)
}

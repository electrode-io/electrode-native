import {
  createTmpDir,
  NativeApplicationDescriptor,
  Platform,
  kax,
  log,
  gitCli,
  shell,
  fileUtils,
  PackagePath,
  utils,
} from 'ern-core'
import { getContainerMetadataPath } from 'ern-container-gen'
import { publishContainer } from 'ern-container-publisher'
import { getActiveCauldron, CauldronNativeAppVersion } from 'ern-cauldron-api'
import { runCauldronContainerGen, runCaudronBundleGen } from './container'
import { runContainerTransformers } from './runContainerTransformers'
import { runContainerPublishers } from './runContainerPublishers'
import * as constants from './constants'
import path from 'path'
import semver from 'semver'
import _ from 'lodash'

//
// Perform some custom work on a container in Cauldron, provided as a
// function, that is going to change the state of the container,
// and regenerate a new container and publish it.
// If any part of this function fails, the Cauldron will not get updated
export async function performContainerStateUpdateInCauldron(
  stateUpdateFunc: () => Promise<any>,
  napDescriptor: NativeApplicationDescriptor,
  commitMessage: string | string[],
  {
    containerVersion,
    forceFullGeneration,
  }: {
    containerVersion?: string
    forceFullGeneration?: boolean
  } = {}
) {
  if (!napDescriptor.platform) {
    throw new Error(`${napDescriptor} does not specify a platform`)
  }

  const platform = napDescriptor.platform
  const outDir = Platform.getContainerGenOutDirectory(platform)
  let cauldronContainerNewVersion
  let cauldron

  try {
    cauldron = await getActiveCauldron()

    const currentContainerVersion = await cauldron.getContainerVersion(
      napDescriptor
    )

    if (containerVersion) {
      cauldronContainerNewVersion = containerVersion
    } else {
      const napVersion: CauldronNativeAppVersion = await cauldron.getDescriptor(
        napDescriptor
      )
      cauldronContainerNewVersion = napVersion.detachContainerVersionFromRoot
        ? await cauldron.getContainerVersion(napDescriptor)
        : await cauldron.getTopLevelContainerVersion(napDescriptor)
      if (cauldronContainerNewVersion) {
        cauldronContainerNewVersion = semver.inc(
          cauldronContainerNewVersion,
          'patch'
        )
      } else {
        // Default to 1.0.0 for Container version
        cauldronContainerNewVersion = '1.0.0'
      }
    }

    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    // Retrieve the list of native dependencies currently in Container
    // (before state of the Container is modified)
    const nativeDependenciesBefore = await cauldron.getNativeDependencies(
      napDescriptor
    )

    // Retrieve the list of MiniApps currently in Container
    // (before state of the Container is modified)
    const miniAppsBefore = await cauldron.getContainerMiniApps(napDescriptor)

    // Perform the custom container state update
    await stateUpdateFunc()

    // Retrieve the list of native dependencies after the state of the Container
    // has been modified.
    const nativeDependenciesAfter = await cauldron.getNativeDependencies(
      napDescriptor
    )

    // Retrieve the list of MiniApps in Container after the state of the Container
    // has been modified
    const miniAppsAfter = await cauldron.getContainerMiniApps(napDescriptor)

    // Is there any changes to native dependencies in the Container ?
    const sameNativeDependencies =
      _.xorBy(nativeDependenciesBefore, nativeDependenciesAfter, 'fullPath')
        .length === 0

    // Is there any new MiniApps in the Container ?
    const containerHasNewMiniApps = miniAppsAfter.length > miniAppsBefore.length

    // Are the MiniApps the exact same as before ?
    const sameMiniApps = await utils.areSamePackagePathsAndVersions(
      miniAppsBefore,
      miniAppsAfter
    )

    const gitPublisher =
      (await cauldron.getPublisher(napDescriptor, 'git')) ||
      (await cauldron.getPublisher(napDescriptor, 'github')) // to deprecate

    if (gitPublisher && !forceFullGeneration) {
      // Clean outDir
      shell.rm('-rf', path.join(outDir, '{.*,*}'))
      // git clone to outDir
      await gitCli().clone(gitPublisher.url, outDir)
      // Check if the raw (untransformed) container exists in the
      // git repository, for the current container version
      const rawContainerVersion = `v${currentContainerVersion}-raw`
      const gitTags = await gitCli(outDir).tags()
      if (gitTags.all.includes(rawContainerVersion)) {
        // git checkout current container version (raw/untransformed)
        await gitCli(outDir).checkout(rawContainerVersion)
        // Remove .git dir
        shell.rm('-rf', path.join(outDir, '.git'))
      }
      // Raw container version does not exist
      // Most probably because Container was generated with a previous
      // version of Electrode Native which was not publishing raw containers
      // In that case, force full generation
      else {
        forceFullGeneration = true
      }
    }

    // No need to generate a container if there was no changes at all
    // compared to current container version
    // In that case only publish the new container version which is
    // basically a rebranding/promotion of an existing container version
    // to a new version
    const publishOnly =
      sameMiniApps &&
      sameNativeDependencies &&
      !forceFullGeneration &&
      gitPublisher

    // No need to regenerate a full Container if all of the following
    // conditions are met
    // - There were no changes to any native dependencies
    //   * Otherwise a full regen is needed to propagate native changes
    // - There was no MiniApp added to the Container
    //   * Otherwise a full regen is needed to in part create new MiniApp activities
    // - The forceFullGeneration flag has not been set
    //   * Otherwise a full regen is needed as request by the user
    // - A git publisher exist
    //   * Otherwise Electrode Native has no way to do a JS bundle only regen
    //     as it has no way to retrieve current Container code base
    // - publishOnly is false
    //   * Otherwise there is no need to regenerate the bundle as only publication
    //     should be achieved
    let jsBundleOnly =
      !containerHasNewMiniApps &&
      sameNativeDependencies &&
      !forceFullGeneration &&
      gitPublisher &&
      !publishOnly

    const compositeMiniAppDir = createTmpDir()

    // Only regenerate bundle if possible
    if (jsBundleOnly) {
      try {
        log.info(
          `No native dependencies changes from ${currentContainerVersion}`
        )
        log.info('Regenerating JS bundle only')
        await runCaudronBundleGen(napDescriptor, {
          compositeMiniAppDir,
          outDir,
        })
        // Update container metadata
        const metadata = await fileUtils.readJSON(
          getContainerMetadataPath(outDir)
        )
        const miniapps = await cauldron.getContainerMiniApps(napDescriptor)
        const jsApiImpls = await cauldron.getContainerJsApiImpls(napDescriptor)
        metadata.miniApps = miniapps.map(m => m.fullPath)
        metadata.jsApiImpls = jsApiImpls.map(j => j.fullPath)
        metadata.ernVersion = Platform.currentVersion
        await fileUtils.writeJSON(getContainerMetadataPath(outDir), metadata)
      } catch (e) {
        log.error(`Something went wrong trying to regenerate JS bundle only`)
        log.error(e)
        log.error(`Falling back to full Container generation`)
        jsBundleOnly = false
      }
    } else if (publishOnly) {
      log.info(`No changes from ${currentContainerVersion}`)
      log.info('Only publishing')
      // Update container metadata
      const metadata = await fileUtils.readJSON(
        getContainerMetadataPath(outDir)
      )
      metadata.ernVersion = Platform.currentVersion
      await fileUtils.writeJSON(getContainerMetadataPath(outDir), metadata)
    }

    // Full container generation
    if (!jsBundleOnly && !publishOnly) {
      await runCauldronContainerGen(napDescriptor, {
        compositeMiniAppDir,
        outDir,
      })
    }

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(
      napDescriptor,
      cauldronContainerNewVersion
    )

    // Update version of ern used to generate this Container
    await cauldron.updateContainerErnVersion(
      napDescriptor,
      Platform.currentVersion
    )

    // If there is a git publisher, now is the time to publish
    // the raw (untransformed) container version, before running the transformers
    if (gitPublisher) {
      await kax.task('Publishing raw Container to git').run(
        publishContainer({
          containerPath: outDir,
          containerVersion: `${cauldronContainerNewVersion}-raw`,
          extra: {
            branch: 'raw',
          },
          platform: napDescriptor.platform!,
          publisher: 'git',
          url: gitPublisher.url,
        })
      )
    }

    // Update yarn lock and run Container transformers sequentially
    if (!publishOnly) {
      const pathToNewYarnLock = path.join(compositeMiniAppDir, 'yarn.lock')
      await cauldron.addOrUpdateYarnLock(
        napDescriptor,
        constants.CONTAINER_YARN_KEY,
        pathToNewYarnLock
      )
      await runContainerTransformers({ napDescriptor, containerPath: outDir })
    }

    // Commit Cauldron transaction
    await kax
      .task('Updating Cauldron')
      .run(cauldron.commitTransaction(commitMessage))

    log.info(
      `Added new container version ${cauldronContainerNewVersion} for ${napDescriptor} in Cauldron`
    )
  } catch (e) {
    log.error(`[performContainerStateUpdateInCauldron] An error occurred: ${e}`)
    if (cauldron) {
      cauldron.discardTransaction()
    }
    throw e
  }

  return runContainerPublishers({
    containerPath: outDir,
    containerVersion: cauldronContainerNewVersion,
    napDescriptor,
  })
}

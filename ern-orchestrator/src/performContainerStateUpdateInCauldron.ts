import {
  createTmpDir,
  NativeApplicationDescriptor,
  Platform,
  kax,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { runCauldronContainerGen } from './container'
import { runContainerTransformers } from './runContainerTransformers'
import { runContainerPublishers } from './runContainerPublishers'
import * as constants from './constants'
import path from 'path'
import semver from 'semver'

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
    throw new Error(
      `napDescriptor (${napDescriptor.toString()}) does not contain a platform`
    )
  }

  const platform = napDescriptor.platform
  const outDir = path.join(
    Platform.rootDirectory,
    'containergen',
    'out',
    platform
  )
  let cauldronContainerVersion
  let cauldron
  let containerGenConfig

  try {
    cauldron = await getActiveCauldron()

    containerGenConfig = await cauldron.getContainerGeneratorConfig(
      napDescriptor
    )

    if (containerVersion) {
      cauldronContainerVersion = containerVersion
    } else {
      cauldronContainerVersion = await cauldron.getTopLevelContainerVersion(
        napDescriptor
      )
      if (cauldronContainerVersion) {
        cauldronContainerVersion = semver.inc(cauldronContainerVersion, 'patch')
      } else {
        // Default to 1.0.0 for Container version
        cauldronContainerVersion = '1.0.0'
      }
    }

    // Begin a Cauldron transaction
    await cauldron.beginTransaction()

    // Perform the custom container state update
    await stateUpdateFunc()

    const compositeMiniAppDir = createTmpDir()

    // Run container generator
    const containerGenResult = await runCauldronContainerGen(napDescriptor, {
      compositeMiniAppDir,
      forceFullGeneration,
      outDir,
    })

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(
      napDescriptor,
      cauldronContainerVersion
    )

    // Update version of ern used to generate this Container
    await cauldron.updateContainerErnVersion(
      napDescriptor,
      Platform.currentVersion
    )

    // Update yarn lock
    const pathToNewYarnLock = path.join(compositeMiniAppDir, 'yarn.lock')
    await cauldron.addOrUpdateYarnLock(
      napDescriptor,
      constants.CONTAINER_YARN_KEY,
      pathToNewYarnLock
    )

    // Run Container transformers sequentially (if any)
    // Only run them if the Container was fully generated and not the JS Bundle only
    // If only JS bundle was generated, it means that we reused previous Container
    // directory, which was already transformed
    if (containerGenResult && !containerGenResult.generatedJsBundleOnly) {
      await runContainerTransformers({ napDescriptor, containerPath: outDir })
    }

    // Commit Cauldron transaction
    await kax
      .task('Updating Cauldron')
      .run(cauldron.commitTransaction(commitMessage))

    log.info(
      `Added new container version ${cauldronContainerVersion} for ${napDescriptor.toString()} in Cauldron`
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
    containerVersion: cauldronContainerVersion,
    napDescriptor,
  })
}

import {
  createTmpDir,
  NativeApplicationDescriptor,
  Platform,
  kax,
  log,
} from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'
import { runCauldronContainerGen } from './container'
import { runContainerPipelineForDescriptor } from './runContainerPipelineForDescriptor'
import * as constants from './constants'
import path from 'path'
import semver from 'semver'
import _ from 'lodash'
import { runCauldronCompositeGen } from './composite'

export async function syncCauldronContainer(
  stateUpdateFunc: () => Promise<any>,
  descriptor: NativeApplicationDescriptor,
  commitMessage: string | string[],
  {
    containerVersion,
  }: {
    containerVersion?: string
  } = {}
) {
  if (!descriptor.platform) {
    throw new Error(`${descriptor} does not specify a platform`)
  }

  const platform = descriptor.platform
  const outDir = Platform.getContainerGenOutDirectory(platform)
  let cauldronContainerNewVersion
  let cauldron

  try {
    cauldron = await getActiveCauldron()

    // ================================================================
    // Set new Container version
    // ================================================================
    if (containerVersion) {
      cauldronContainerNewVersion = containerVersion
    } else {
      const detachContainerVersionFromRoot = await cauldron.getConfigForKey(
        'detachContainerVersionFromRoot',
        descriptor
      )
      cauldronContainerNewVersion = detachContainerVersionFromRoot
        ? await cauldron.getContainerVersion(descriptor)
        : await cauldron.getTopLevelContainerVersion(descriptor)
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

    // Trigger state change in Cauldron
    await stateUpdateFunc()

    // ================================================================
    // Generate Composite from Cauldron
    // ================================================================
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      descriptor
    )
    const baseComposite = compositeGenConfig && compositeGenConfig.baseComposite

    const compositeDir = createTmpDir()

    const composite = await kax.task('Generating Composite from Cauldron').run(
      runCauldronCompositeGen(descriptor, {
        baseComposite,
        outDir: compositeDir,
      })
    )

    // ================================================================
    // Sync native dependencies in Cauldron with any changes of native
    // dependencies in Composite (new or updated native dependencies)
    // ================================================================
    const cauldronNativeDependencies = await cauldron.getNativeDependencies(
      descriptor
    )
    const compositeNativeDeps = await composite.getResolvedNativeDependencies()

    // Final native dependencies are the one that are in Composite
    // plus any extra ones present in the Cauldron that are not
    // in the Composite
    const extraCauldronNativeDependencies = _.differenceBy(
      cauldronNativeDependencies,
      compositeNativeDeps.resolved,
      'basePath'
    )
    const nativeDependencies = [
      ...extraCauldronNativeDependencies,
      ...compositeNativeDeps.resolved,
    ]
    await cauldron.syncContainerNativeDependencies(
      descriptor,
      nativeDependencies
    )

    // Generate Container from Cauldron
    await kax.task('Generating Container from Cauldron').run(
      runCauldronContainerGen(descriptor, composite, {
        outDir,
      })
    )

    // Update container version in Cauldron
    await cauldron.updateContainerVersion(
      descriptor,
      cauldronContainerNewVersion
    )

    // Update version of ern used to generate this Container
    await cauldron.updateContainerErnVersion(
      descriptor,
      Platform.currentVersion
    )

    // Update yarn lock and run Container transformers sequentially
    const pathToNewYarnLock = path.join(compositeDir, 'yarn.lock')
    await cauldron.addOrUpdateYarnLock(
      descriptor,
      constants.CONTAINER_YARN_KEY,
      pathToNewYarnLock
    )

    // Run container pipeline (transformers/publishers)
    await kax.task('Running Container Pipeline').run(
      runContainerPipelineForDescriptor({
        containerPath: outDir,
        containerVersion: cauldronContainerNewVersion,
        descriptor,
      })
    )

    // Commit Cauldron transaction
    await kax
      .task('Updating Cauldron')
      .run(cauldron.commitTransaction(commitMessage))

    log.info(
      `Added new container version ${cauldronContainerNewVersion} for ${descriptor} in Cauldron`
    )
  } catch (e) {
    log.error(`[syncCauldronContainer] An error occurred: ${e}`)
    if (cauldron) {
      cauldron.discardTransaction()
    }
    throw e
  }
}

import {
  createTmpDir,
  Platform,
  kax,
  log,
  AppVersionDescriptor,
  SourceMapStoreSdk,
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
  descriptor: AppVersionDescriptor,
  commitMessage: string | string[],
  {
    containerVersion,
    sourceMapOutput,
  }: {
    containerVersion?: string
    sourceMapOutput?: string
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

    // Sync native dependencies in Cauldron
    const compositeNativeDeps = await composite.getInjectableNativeDependencies(
      platform
    )
    await cauldron.setNativeDependenciesInContainer(
      descriptor,
      compositeNativeDeps
    )

    // Generate Container from Cauldron
    sourceMapOutput = sourceMapOutput || path.join(createTmpDir(), 'index.map')
    await kax.task('Generating Container from Cauldron').run(
      runCauldronContainerGen(descriptor, composite, {
        outDir,
        sourceMapOutput,
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

    // Upload source map if a source map store server is configured
    const sourcemapStoreConfig = await cauldron.getSourceMapStoreConfig()
    if (sourcemapStoreConfig) {
      try {
        const sdk = new SourceMapStoreSdk(sourcemapStoreConfig.url)
        await kax
          .task(
            `Uploading source map to source map store [${
              sourcemapStoreConfig.url
            }]`
          )
          .run(
            sdk.uploadContainerSourceMap({
              containerVersion: cauldronContainerNewVersion,
              descriptor,
              sourceMapPath: sourceMapOutput,
            })
          )
      } catch (e) {
        log.error(`Source map upload failed : ${e}`)
      }
    }

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

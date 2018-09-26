import { sortDependenciesByName } from './sortDependenciesByName'
import { bundleMiniApps } from './bundleMiniApps'
import { copyRnpmAssets } from './copyRnpmAssets'
import { addContainerMetadata } from './addContainerMetadata'
import { getContainerMetadata } from './getContainerMetadata'
import { ContainerGeneratorConfig, ContainerGenResult } from './types'
import { kax, shell, utils, BundlingResult, Platform } from 'ern-core'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

type ContainerGeneratorAction = (
  config: ContainerGeneratorConfig
) => Promise<any>

export async function generateContainer(
  config: ContainerGeneratorConfig,
  {
    fillContainerHull,
    postCopyRnpmAssets,
  }: {
    fillContainerHull?: ContainerGeneratorAction
    postCopyRnpmAssets?: ContainerGeneratorAction
  } = {}
): Promise<ContainerGenResult> {
  let generatedJsBundleOnly = false
  if (!fs.existsSync(config.outDir)) {
    shell.mkdir('-p', config.outDir)
  } else {
    if (!config.forceFullGeneration) {
      // Let's look if we can avoid full generation and only regenerate js bundle
      const previousGenMetadata = await getContainerMetadata(config.outDir)

      if (
        previousGenMetadata &&
        // Only perform partial generation if previous Container generation
        // was done using the same Electrode Native version as the one running
        // this new Container generation
        previousGenMetadata.ernVersion === Platform.currentVersion &&
        previousGenMetadata.nativeDeps
      ) {
        const pluginsAsStrings = config.plugins.map(p => p.toString())
        const xored = _.xor(pluginsAsStrings, previousGenMetadata.nativeDeps)
        if (xored.length > 0) {
          // There is at least one difference in native dependencies versions
          // Just clean the whole out directory and trigger a full generation
          shell.rm('-rf', path.join(config.outDir, '{.*,*}'))
        } else {
          // No difference in native dependencies versions !
          // We can take a fast track. We just remove all plugins from the
          // config we feed to the generator, so that it'll only regenerate the
          // JS bundle
          // Also we don't clean the out directory
          generatedJsBundleOnly = true
        }
      }
    } else {
      shell.rm('-rf', path.join(config.outDir, '{.*,*}'))
    }
  }

  if (!fs.existsSync(config.compositeMiniAppDir)) {
    shell.mkdir('-p', config.compositeMiniAppDir)
  } else {
    shell.rm('-rf', path.join(config.compositeMiniAppDir, '{.*,*}'))
  }

  if (!fs.existsSync(config.pluginsDownloadDir)) {
    shell.mkdir('-p', config.pluginsDownloadDir)
  } else {
    shell.rm('-rf', path.join(config.pluginsDownloadDir, '{.*,*}'))
  }

  if (!generatedJsBundleOnly) {
    config.plugins = sortDependenciesByName(config.plugins)

    shell.pushd(config.outDir)
    try {
      if (fillContainerHull) {
        await fillContainerHull(config)
      }
    } finally {
      shell.popd()
    }
  }

  const bundlingResult: BundlingResult = await kax
    .task('Bundling MiniApps')
    .run(
      bundleMiniApps(
        config.miniApps,
        config.compositeMiniAppDir,
        config.outDir,
        config.targetPlatform,
        { pathToYarnLock: config.pathToYarnLock },
        config.jsApiImpls
      )
    )

  if (!config.ignoreRnpmAssets) {
    await kax
      .task('Coying rnpm assets -if any-')
      .run(
        copyRnpmAssets(
          config.miniApps,
          config.compositeMiniAppDir,
          config.outDir,
          config.targetPlatform
        )
      )
    if (postCopyRnpmAssets) {
      await postCopyRnpmAssets(config)
    }
  }

  await kax
    .task('Adding Electrode Native Metadata File')
    .run(addContainerMetadata(config))

  return {
    bundlingResult,
    generatedJsBundleOnly,
  }
}

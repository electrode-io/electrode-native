import { sortDependenciesByName } from './sortDependenciesByName'
import { bundleMiniAppsFromComposite } from './bundleMiniApps'
import { copyRnpmAssets } from './copyRnpmAssets'
import { copyRnConfigAssets } from './copyRnConfigAssets'
import { addContainerMetadata } from './addContainerMetadata'
import { ContainerGeneratorConfig, ContainerGenResult } from './types'
import { kax, shell, BundlingResult } from 'ern-core'
import fs from 'fs-extra'
import path from 'path'
import _ from 'lodash'

type ContainerGeneratorAction = (
  config: ContainerGeneratorConfig
) => Promise<any>

type PostBundleAction = (
  config: ContainerGeneratorConfig,
  bundle: BundlingResult
) => Promise<any>

export async function generateContainer(
  config: ContainerGeneratorConfig,
  {
    fillContainerHull,
    postCopyRnpmAssets,
    postBundle,
  }: {
    fillContainerHull?: ContainerGeneratorAction
    postCopyRnpmAssets?: ContainerGeneratorAction
    postBundle?: PostBundleAction
  } = {}
): Promise<ContainerGenResult> {
  fs.ensureDirSync(config.outDir)
  shell.rm('-rf', path.join(config.outDir, '{.*,*}'))

  config.plugins = sortDependenciesByName(config.plugins)

  const reactNativePlugin = _.find(
    config.plugins,
    p => p.basePath === 'react-native'
  )

  // React-native plugin should be first in the dependencies
  // Otherwise any module dependent on r-n won't be able to use it
  config.plugins = [
    ...(reactNativePlugin ? [reactNativePlugin] : []),
    ...config.plugins.filter(plugin => plugin !== reactNativePlugin),
  ]

  shell.pushd(config.outDir)
  try {
    if (fillContainerHull) {
      await fillContainerHull(config)
    }
  } finally {
    shell.popd()
  }

  const bundlingResult: BundlingResult = await kax
    .task('Bundling MiniApps')
    .run(
      bundleMiniAppsFromComposite({
        compositeDir: config.composite.path,
        dev: !!config.devJsBundle,
        outDir: config.outDir,
        platform: config.targetPlatform,
        sourceMapOutput: config.sourceMapOutput,
      })
    )

  if (postBundle) {
    await postBundle(config, bundlingResult)
  }

  if (!config.ignoreRnpmAssets) {
    copyRnpmAssets(
      config.composite.getMiniApps(),
      config.composite.path,
      config.outDir,
      config.targetPlatform
    )

    await copyRnConfigAssets({
      compositePath: config.composite.path,
      outDir: config.outDir,
      platform: config.targetPlatform,
    })

    if (postCopyRnpmAssets) {
      await postCopyRnpmAssets(config)
    }
  }

  await kax
    .task('Adding Electrode Native Metadata File')
    .run(addContainerMetadata(config))

  return {
    bundlingResult,
    config,
  }
}

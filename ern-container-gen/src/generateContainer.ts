import { prepareDirectories } from './prepareDirectories'
import { sortDependenciesByName } from './sortDependenciesByName'
import { bundleMiniApps } from './bundleMiniApps'
import { copyRnpmAssets } from './copyRnpmAssets'
import { addContainerMetadata } from './addContainerMetadata'
import { ContainerGeneratorConfig, ContainerGenResult } from './types'
import { kax, shell, utils, BundlingResult } from 'ern-core'

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
  prepareDirectories(config)
  config.plugins = sortDependenciesByName(config.plugins)

  shell.cd(config.outDir)

  if (fillContainerHull) {
    await fillContainerHull(config)
  }

  const jsApiImplDependencies = await utils.extractJsApiImplementations(
    config.plugins
  )

  const bundlingResult: BundlingResult = await kax
    .task('Bundling MiniApps')
    .run(
      bundleMiniApps(
        config.miniApps,
        config.compositeMiniAppDir,
        config.outDir,
        config.targetPlatform,
        { pathToYarnLock: config.pathToYarnLock },
        jsApiImplDependencies
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
  }
}

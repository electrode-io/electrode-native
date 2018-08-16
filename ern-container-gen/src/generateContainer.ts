import { sortDependenciesByName } from './sortDependenciesByName'
import { bundleMiniApps } from './bundleMiniApps'
import { copyRnpmAssets } from './copyRnpmAssets'
import { addContainerMetadata } from './addContainerMetadata'
import { getContainerMetadata } from './getContainerMetadata'
import { ContainerGeneratorConfig, ContainerGenResult } from './types'
import { kax, shell, utils, BundlingResult } from 'ern-core'
import fs from 'fs'
import path from 'path'

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
  if (!fs.existsSync(config.outDir)) {
    shell.mkdir('-p', config.outDir)
  } else {
    shell.rm('-rf', path.join(config.outDir, '{.*,*}'))
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

  config.plugins = sortDependenciesByName(config.plugins)

  shell.pushd(config.outDir)
  try {
    if (fillContainerHull) {
      await fillContainerHull(config)
    }
  } finally {
    shell.popd()
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

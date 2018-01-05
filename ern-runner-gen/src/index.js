// @flow

import {
  IosGenerator,
  AndroidGenerator
} from 'ern-container-gen'
import {
  Dependency,
  mustacheUtils,
  spin,
  shell
} from 'ern-core'
import readDir from 'fs-readdir-recursive'
import path from 'path'
import tmp from 'tmp'

// ==============================================================================
// Misc utitlities
// ==============================================================================

// Given a string returns the same string with its first letter capitalized
function pascalCase (str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

// =============================================================================
// Main
// =============================================================================

const runnerHullPath = path.join(__dirname, '..', 'runner-hull')

export async function generateRunnerProject (
  platform: string,
  outDir: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string, {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  try {
    if (platform === 'android') {
      await generateAndroidRunnerProject(
        outDir, containerGenWorkingDir, mainMiniAppName, { reactNativeDevSupportEnabled })
    } else if (platform === 'ios') {
      await generateIosRunnerProject(
        outDir, containerGenWorkingDir, mainMiniAppName, { reactNativeDevSupportEnabled })
    }
  } catch (e) {
    log.error('Something went wrong: ' + e)
    throw e
  }
}

export async function generateAndroidRunnerProject (
  outDir: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string, {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  const mustacheView = {
    miniAppName: mainMiniAppName,
    pascalCaseMiniAppName: pascalCase(mainMiniAppName),
    isReactNativeDevSupportEnabled: reactNativeDevSupportEnabled === true ? 'true' : 'false'
  }
  shell.cp('-R', path.join(runnerHullPath, 'android', '*'), outDir)
  const files = readDir(path.join(runnerHullPath, 'android'),
            (f) => (!f.endsWith('.jar') && !f.endsWith('.png')))
  for (const file of files) {
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
                path.join(outDir, file), mustacheView, path.join(outDir, file))
  }
}

export async function generateIosRunnerProject (
  outDir: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string, {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  const pathToElectrodeContainerXcodeProj = replaceHomePathWithTidle(path.join(containerGenWorkingDir, 'out', 'ios'))
  const mustacheView = {
    miniAppName: mainMiniAppName,
    pascalCaseMiniAppName: pascalCase(mainMiniAppName),
    isReactNativeDevSupportEnabled: reactNativeDevSupportEnabled === true ? 'YES' : 'NO',
    pathToElectrodeContainerXcodeProj
  }

  shell.cp('-R', path.join(runnerHullPath, 'ios', '*'), outDir)
  const filesToMustache = [
    path.join(outDir, 'ErnRunner', 'RunnerConfig.m'),
    path.join(outDir, 'ErnRunner.xcodeproj', 'project.pbxproj')]

  for (const file of filesToMustache) {
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
    file, mustacheView, file)
  }
}

export async function regenerateRunnerConfig (
  platform: string,
  outDir: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string, {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  try {
    if (platform === 'android') {
      await regenerateAndroidRunnerConfig(
        outDir, containerGenWorkingDir, mainMiniAppName, { reactNativeDevSupportEnabled })
    } else if (platform === 'ios') {
      await regenerateIosRunnerConfig(
        outDir, containerGenWorkingDir, mainMiniAppName, { reactNativeDevSupportEnabled })
    }
  } catch (e) {
    log.error('Something went wrong: ' + e)
    throw e
  }
}

export async function regenerateAndroidRunnerConfig (
  pathToRunnerProject: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string, {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  const mustacheView = {
    miniAppName: mainMiniAppName,
    pascalCaseMiniAppName: pascalCase(mainMiniAppName),
    isReactNativeDevSupportEnabled: reactNativeDevSupportEnabled === true ? 'true' : 'false'
  }
  const subPathToRunnerConfig = path.join('app', 'src', 'main', 'java', 'com', 'walmartlabs', 'ern', 'RunnerConfig.java')
  const pathToRunnerConfigHull = path.join(runnerHullPath, 'android', subPathToRunnerConfig)
  const pathToRunnerConfig = path.join(pathToRunnerProject, subPathToRunnerConfig)
  shell.cp(pathToRunnerConfigHull, pathToRunnerConfig)
  await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
    pathToRunnerConfig, mustacheView, pathToRunnerConfig)
}

export async function regenerateIosRunnerConfig (
  pathToRunnerProject: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string,
  {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  const pathToElectrodeContainerXcodeProj = replaceHomePathWithTidle(path.join(containerGenWorkingDir, 'out', 'ios'))
  const mustacheView = {
    miniAppName: mainMiniAppName,
    pascalCaseMiniAppName: pascalCase(mainMiniAppName),
    isReactNativeDevSupportEnabled: reactNativeDevSupportEnabled === true ? 'YES' : 'NO',
    pathToElectrodeContainerXcodeProj
  }
  const pathToRunnerConfig = path.join(pathToRunnerProject, 'ErnRunner/RunnerConfig.m')
  shell.cp(path.join(runnerHullPath, 'ios', 'ErnRunner', 'RunnerConfig.m'), pathToRunnerConfig)
  await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
    pathToRunnerConfig, mustacheView, pathToRunnerConfig)
}

export async function generateContainerForRunner ({
  plugins,
  miniapp,
  platform,
  containerGenWorkingDir
} : {
  plugins: Array<Dependency>,
  miniapp: Object,
  platform: 'android' | 'ios',
  containerGenWorkingDir: string
}) {
  const generator = (platform === 'android')
    ? new AndroidGenerator()
    : new IosGenerator()

  await spin('Generating Runner Container project', generator.generate({
    plugins,
    miniApps: [miniapp],
    outDir: containerGenWorkingDir,
    pluginsDownloadDir: tmp.dirSync({ unsafeCleanup: true }).name,
    compositeMiniAppDir: tmp.dirSync({ unsafeCleanup: true }).name
  }))
}

function replaceHomePathWithTidle (p: string) {
  return process.env.HOME
    ? p.replace(process.env.HOME, '~')
    : p
}

// @flow

import {
  generateContainer,
  IosGenerator,
  AndroidGenerator
} from 'ern-container-gen'
import {
  Dependency,
  mustacheUtils,
  spin,
  shell
} from 'ern-util'
import {
  ContainerGeneratorConfig
} from 'ern-core'
import readDir from 'fs-readdir-recursive'
import path from 'path'

let log

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

const RUNNER_CONTAINER_VERSION = '1.0.0'
const runnerHullPath = path.join(__dirname, '..', 'runner-hull')

// Generate the runner project
// platformPath : Path to the ern-platform to use
// plugins : Array containing all plugins to be included in the generated container
// miniapp : The miniapp to attach to this runner. Needs to have localPath set !
// outDirectory : Where the generated project will be outputed
export async function generateRunner ({
  platformPath,
  plugins,
  miniapp,
  outDir,
  platform,
  containerGenWorkingDir,
  reactNativeDevSupportEnabled
} : {
  platformPath: string,
  plugins: Array<Object>,
  miniapp: Object,
  outDir: string,
  platform: 'android' | 'ios',
  containerGenWorkingDir: string,
  reactNativeDevSupportEnabled: boolean
}) {
  try {
    if (!miniapp.localPath) {
      throw new Error('Miniapp must come with a local path !')
    }

    shell.mkdir(outDir)

    if (platform === 'android') {
      await generateAndroidRunnerProject(
        platformPath, outDir, containerGenWorkingDir, miniapp.name, { reactNativeDevSupportEnabled })
    } else if (platform === 'ios') {
      await generateIosRunnerProject(
        platformPath, outDir, containerGenWorkingDir, miniapp.name, { reactNativeDevSupportEnabled })
    }

    await generateContainerForRunner({
      platformPath,
      plugins,
      miniapp,
      platform,
      containerGenWorkingDir
    })
  } catch (e) {
    log.error('Something went wrong: ' + e)
    throw e
  }
}

export async function generateAndroidRunnerProject (
  platformPath: string,
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

export async function regenerateAndroidRunnerConfig (
  platformPath: string,
  pathToRunnerProject: string,
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

export async function generateIosRunnerProject (
  platformPath: string,
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
    isReactNativeDevSupportEnabled: reactNativeDevSupportEnabled === true ? 'YES' : 'NO',
    pathToElectrodeContainerXcodeProj: path.join(containerGenWorkingDir, 'out', 'ios')
  }

  shell.cp('-R', path.join(runnerHullPath, 'ios', '*'), outDir)
  const files = readDir(path.join(runnerHullPath, 'ios'))
  for (const file of files) {
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(outDir, file), mustacheView, path.join(outDir, file))
  }
}

export async function regenerateIosRunnerConfig (
  platformPath: string,
  pathToRunnerProject: string,
  containerGenWorkingDir: string,
  mainMiniAppName: string,
  {
    reactNativeDevSupportEnabled
  } : {
    reactNativeDevSupportEnabled?: boolean
  } = {}) {
  const mustacheView = {
    miniAppName: mainMiniAppName,
    pascalCaseMiniAppName: pascalCase(mainMiniAppName),
    isReactNativeDevSupportEnabled: reactNativeDevSupportEnabled === true ? 'YES' : 'NO',
    pathToElectrodeContainerXcodeProj: path.join(containerGenWorkingDir, 'out', 'ios')
  }
  const pathToRunnerConfig = path.join(pathToRunnerProject, 'ErnRunner/RunnerConfig.m')
  shell.cp(path.join(runnerHullPath}, 'ios', 'ErnRunner', 'RunnerConfig.m', pathToRunnerConfig))
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
  const generatorConfig = new ContainerGeneratorConfig(platform)
  const generator = (platform === 'android')
    ? new AndroidGenerator({containerGeneratorConfig: generatorConfig})
    : new IosGenerator(generatorConfig)

  await spin('Generating Runner Container project', generateContainer({
    containerVersion: RUNNER_CONTAINER_VERSION,
    nativeAppName: 'runner',
    generator,
    plugins,
    miniapps: [miniapp],
    workingDirectory: containerGenWorkingDir
  }))
}

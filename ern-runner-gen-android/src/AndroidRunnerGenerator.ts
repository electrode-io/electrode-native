import { RunnerGenerator, RunnerGeneratorConfig } from 'ern-runner-gen'
import { mustacheUtils, NativePlatform, shell } from 'ern-core'
import readDir from 'fs-readdir-recursive'
import path from 'path'
import { android } from 'ern-core'

const runnerHullPath = path.join(__dirname, 'hull')
const defaultReactNativePackagerHost = 'localhost'
const defaultReactNativePackagerPort = '8081'

export default class AndroidRunnerGenerator implements RunnerGenerator {
  public get platform(): NativePlatform {
    return 'android'
  }

  public async generate(config: RunnerGeneratorConfig): Promise<void> {
    const mustacheView = {
      androidGradlePlugin: android.DEFAULT_ANDROID_GRADLE_PLUGIN_VERSION,
      buildToolsVersion: android.DEFAULT_BUILD_TOOLS_VERSION,
      compileSdkVersion: android.DEFAULT_COMPILE_SDK_VERSION,
      gradleDistributionUrl: android.DEFAULT_GRADLE_DISTRIBUTION_URL,
      isReactNativeDevSupportEnabled:
        config.reactNativeDevSupportEnabled === true ? 'true' : 'false',
      minSdkVersion: android.DEFAULT_MIN_SDK_VERSION,
      miniAppName: config.mainMiniAppName,
      packagerHost:
        config.reactNativePackagerHost || defaultReactNativePackagerHost,
      packagerPort:
        config.reactNativePackagerPort || defaultReactNativePackagerPort,
      pascalCaseMiniAppName: pascalCase(config.mainMiniAppName),
      supportLibraryVersion: android.DEFAULT_SUPPORT_LIBRARY,
      targetSdkVersion: android.DEFAULT_TARGET_SDK_VERSION,
    }
    shell.cp('-R', path.join(runnerHullPath, '*'), config.outDir)
    const files = readDir(
      runnerHullPath,
      f => !f.endsWith('.jar') && !f.endsWith('.png')
    )
    for (const file of files) {
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        path.join(config.outDir, file),
        mustacheView,
        path.join(config.outDir, file)
      )
    }
  }

  public async regenerateRunnerConfig(
    config: RunnerGeneratorConfig
  ): Promise<void> {
    const mustacheView = {
      isReactNativeDevSupportEnabled:
        config.reactNativeDevSupportEnabled === true ? 'true' : 'false',
      miniAppName: config.mainMiniAppName,
      packagerHost:
        config.reactNativePackagerHost || defaultReactNativePackagerHost,
      packagerPort:
        config.reactNativePackagerPort || defaultReactNativePackagerPort,
      pascalCaseMiniAppName: pascalCase(config.mainMiniAppName),
    }
    const subPathToRunnerConfig = path.join(
      'app',
      'src',
      'main',
      'java',
      'com',
      'walmartlabs',
      'ern',
      'RunnerConfig.java'
    )
    const pathToRunnerConfigHull = path.join(
      runnerHullPath,
      subPathToRunnerConfig
    )
    const pathToRunnerConfig = path.join(config.outDir, subPathToRunnerConfig)
    shell.cp(pathToRunnerConfigHull, pathToRunnerConfig)
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      pathToRunnerConfig,
      mustacheView,
      pathToRunnerConfig
    )
  }
}

// Given a string returns the same string with its first letter capitalized
function pascalCase(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

import { RunnerGenerator, RunnerGeneratorConfig } from 'ern-runner-gen'
import {
  mustacheUtils,
  NativePlatform,
  shell,
  injectReactNativeVersionKeysInObject,
} from 'ern-core'
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
    let mustacheView: any = {}
    mustacheView = configureMustacheView(config, mustacheView)

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
    let mustacheView: any = {}
    mustacheView = configureMustacheView(config, mustacheView)

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

function configureMustacheView(
  config: RunnerGeneratorConfig,
  mustacheView: any
) {
  const versions = android.resolveAndroidVersions(
    config.extra && config.extra.androidConfig
  )
  mustacheView = Object.assign(mustacheView, versions)

  mustacheView.isReactNativeDevSupportEnabled =
    config.reactNativeDevSupportEnabled === true ? 'true' : 'false'
  mustacheView.miniAppName = config.mainMiniAppName
  mustacheView.packagerHost =
    config.reactNativePackagerHost || defaultReactNativePackagerHost
  mustacheView.packagerPort =
    config.reactNativePackagerPort || defaultReactNativePackagerPort
  mustacheView.pascalCaseMiniAppName = pascalCase(config.mainMiniAppName)

  injectReactNativeVersionKeysInObject(mustacheView, config.reactNativeVersion)

  return mustacheView
}

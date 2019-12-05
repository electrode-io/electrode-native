import { RunnerGenerator, RunnerGeneratorConfig } from 'ern-runner-gen'
import {
  mustacheUtils,
  NativePlatform,
  shell,
  injectReactNativeVersionKeysInObject,
} from 'ern-core'
import path from 'path'

const defaultReactNativePackagerHost = 'localhost'
const defaultReactNativePackagerPort = '8081'
const runnerHullPath = path.join(__dirname, 'hull')

export default class IosRunerGenerator implements RunnerGenerator {
  public get platform(): NativePlatform {
    return 'ios'
  }

  public async generate(config: RunnerGeneratorConfig): Promise<void> {
    this.validateExtraConfig(config)
    const mustacheView = this.createMustacheView({ config })

    shell.cp('-R', path.join(runnerHullPath, '*'), config.outDir)
    const filesToMustache = [
      path.join(config.outDir, 'ErnRunner/RunnerConfig.m'),
      path.join(config.outDir, 'ErnRunner.xcodeproj/project.pbxproj'),
    ]

    for (const file of filesToMustache) {
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        file,
        mustacheView,
        file
      )
    }
  }

  public async regenerateRunnerConfig(
    config: RunnerGeneratorConfig
  ): Promise<void> {
    this.validateExtraConfig(config)
    const mustacheView = this.createMustacheView({ config })
    const pathToRunnerConfig = path.join(
      config.outDir,
      'ErnRunner/RunnerConfig.m'
    )
    shell.cp(
      path.join(runnerHullPath, 'ErnRunner/RunnerConfig.m'),
      pathToRunnerConfig
    )
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      pathToRunnerConfig,
      mustacheView,
      pathToRunnerConfig
    )
  }

  public createMustacheView({ config }: { config: RunnerGeneratorConfig }) {
    const pathToElectrodeContainerXcodeProj = replaceHomePathWithTidle(
      path.join(config.extra.containerGenWorkingDir, 'out/ios')
    )
    const mustacheView = {
      isReactNativeDevSupportEnabled:
        config.reactNativeDevSupportEnabled === true ? 'YES' : 'NO',
      miniAppName: config.mainMiniAppName,
      packagerHost:
        config.reactNativePackagerHost ?? defaultReactNativePackagerHost,
      packagerPort:
        config.reactNativePackagerPort ?? defaultReactNativePackagerPort,
      pascalCaseMiniAppName: pascalCase(config.mainMiniAppName),
      pathToElectrodeContainerXcodeProj,
    }

    injectReactNativeVersionKeysInObject(
      mustacheView,
      config.reactNativeVersion
    )

    return mustacheView
  }

  private validateExtraConfig(config: RunnerGeneratorConfig) {
    if (!config.extra || !config.extra.containerGenWorkingDir) {
      throw new Error('Missing containerGenWorkingDir in extra config')
    }
  }
}

// Given a string returns the same string with its first letter capitalized
function pascalCase(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

function replaceHomePathWithTidle(p: string) {
  return process.env.HOME ? p.replace(process.env.HOME, '~') : p
}

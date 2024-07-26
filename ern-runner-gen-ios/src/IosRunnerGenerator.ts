import { RunnerGenerator, RunnerGeneratorConfig } from 'ern-runner-gen';
import {
  injectReactNativeVersionKeysInObject,
  mustacheUtils,
  NativePlatform,
  shell,
} from 'ern-core';
import path from 'path';
import fs from 'fs-extra';
import semver from 'semver';

const defaultReactNativePackagerHost = 'localhost';
const defaultReactNativePackagerPort = '8081';
const runnerHullPath = path.join(__dirname, 'hull');

export default class IosRunerGenerator implements RunnerGenerator {
  public get platform(): NativePlatform {
    return 'ios';
  }

  public async generate(config: RunnerGeneratorConfig): Promise<void> {
    this.validateExtraConfig(config);
    const mustacheView = this.createMustacheView({ config });

    shell.cp('-R', path.join(runnerHullPath, '*'), config.outDir);

    const filesToMustache = [
      'ErnRunner/RunnerConfig.swift',
      'ErnRunner.xcodeproj/project.pbxproj',
    ];

    if ((mustacheView as any).RN_VERSION_LT_61) {
      // Delete ErnRunner.xcworkspace directory as it is only needed for RN61+
      shell.rm('-rf', path.join(config.outDir, 'ErnRunner.xcworkspace'));
    } else {
      // Otherwise keep it and include the xcworkspacedata file for mustache
      // processing as it contains some mustache template placeholders
      filesToMustache.push('ErnRunner.xcworkspace/contents.xcworkspacedata');
    }

    for (const file of filesToMustache) {
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        path.join(config.outDir, file),
        mustacheView,
        path.join(config.outDir, file),
      );
    }
  }

  public async regenerateRunnerConfig(
    config: RunnerGeneratorConfig,
  ): Promise<void> {
    this.validateExtraConfig(config);
    const mustacheView = this.createMustacheView({ config });
    const pathToRunnerConfig = path.join(
      config.outDir,
      'ErnRunner/RunnerConfig.swift',
    );
    shell.cp(
      path.join(runnerHullPath, 'ErnRunner/RunnerConfig.swift'),
      pathToRunnerConfig,
    );
    await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      pathToRunnerConfig,
      mustacheView,
      pathToRunnerConfig,
    );
    if ((mustacheView as any).RN_VERSION_GTE_61) {
      // If using a version of react native >= 0.61.0 and if the xcworkspace
      // is not present in runner, let's copy it
      const xcworkspacePath = path.join(config.outDir, 'ErnRunner.xcworkspace');
      if (!fs.pathExistsSync(xcworkspacePath)) {
        shell.cp(
          '-rf',
          path.join(runnerHullPath, 'ErnRunner.xcworkspace'),
          config.outDir,
        );
      }
    }
  }

  public createMustacheView({ config }: { config: RunnerGeneratorConfig }) {
    const pathToElectrodeContainerXcodeProj = replaceHomePathWithTidle(
      path.join(config.extra.containerGenWorkingDir, 'out/ios'),
    );
    const mustacheView = {
      deploymentTarget: semver.gte(config.reactNativeVersion, '0.72.0')
        ? '12.4'
        : '11.0',
      isReactNativeDevSupportEnabled:
        config.reactNativeDevSupportEnabled === true ? 'true' : 'false',
      miniAppName: config.mainMiniAppName,
      packagerHost:
        config.reactNativePackagerHost ?? defaultReactNativePackagerHost,
      packagerPort:
        config.reactNativePackagerPort ?? defaultReactNativePackagerPort,
      pascalCaseMiniAppName: pascalCase(config.mainMiniAppName),
      pathToElectrodeContainerXcodeProj,
    };

    injectReactNativeVersionKeysInObject(
      mustacheView,
      config.reactNativeVersion,
    );

    return mustacheView;
  }

  private validateExtraConfig(config: RunnerGeneratorConfig) {
    if (!config.extra || !config.extra.containerGenWorkingDir) {
      throw new Error('Missing containerGenWorkingDir in extra config');
    }
  }
}

// Given a string returns the same string with its first letter capitalized
function pascalCase(str: string) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

function replaceHomePathWithTidle(p: string) {
  return process.env.HOME ? p.replace(process.env.HOME, '~') : p;
}

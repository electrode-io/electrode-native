import log from './log';
import { AndroidPluginConfigGenerator } from './AndroidPluginConfigGenerator';
import { IosPluginConfigGenerator } from './IosPluginConfigGenerator';

export class PluginConfigGenerator {
  public static async generateFromPath({
    pluginPath,
    revolveBuildGradlePath,
    resolvePbxProjPath,
    resolveDependencyVersion,
  }: {
    pluginPath: string;
    revolveBuildGradlePath: (buildGradlePaths: string[]) => Promise<string>;
    resolvePbxProjPath: (pbxProjPaths: string[]) => Promise<string>;
    resolveDependencyVersion: (dependency: string) => Promise<string>;
  }): Promise<{
    pluginConfig: any;
    androidPluginSource: { filename: string; content: string } | void;
  }> {
    const result: any = {};
    const androidGenerator = AndroidPluginConfigGenerator.fromPath(pluginPath);
    const iosGenerator = IosPluginConfigGenerator.fromPath(pluginPath);

    if (androidGenerator.doesPluginSupportAndroid) {
      try {
        result.pluginConfig = result.pluginConfig || {};
        result.pluginConfig.android = await androidGenerator.generateConfig({
          resolveDependencyVersion,
          revolveBuildGradlePath,
        });
        result.androidPluginSource =
          await androidGenerator.generatePluginSource();
        log.info('Generated Android plugin configuration');
      } catch (e) {
        throw new Error(`Failed to generate Android Plugin Configuration.

Reason: ${e.message}`);
      }
    } else {
      log.warn(
        `[Skipping Android generation] Looks like this plugin does not support Android.`,
      );
    }

    if (iosGenerator.doesPluginSupportIos) {
      try {
        result.pluginConfig = result.pluginConfig || {};
        result.pluginConfig.ios = await iosGenerator.generateConfig({
          resolvePbxProjPath,
        });
        log.info('Generated iOS plugin configuration');
      } catch (e) {
        throw new Error(`Failed to generate iOS Plugin Configuration.

Reason: ${e.message}`);
      }
    } else {
      log.warn(
        `[Skipping iOS generation] Looks like this plugin does not support iOS.`,
      );
    }

    return result;
  }
}

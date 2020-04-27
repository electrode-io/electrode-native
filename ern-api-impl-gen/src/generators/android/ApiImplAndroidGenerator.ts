import {
  android,
  fileUtils,
  log,
  manifest,
  mustacheUtils,
  PackagePath,
  Platform,
  PluginConfig,
  shell,
} from 'ern-core';
import fs from 'fs-extra';
import path from 'path';
import readDir from 'fs-readdir-recursive';
import { ApiImplGeneratable } from '../../ApiImplGeneratable';

export const ROOT_DIR = shell.pwd();
const SRC_MAIN_JAVA_DIR = path.normalize('src/main/java');
const API_IMPL_PACKAGE = path.normalize('com/ern/api/impl');

export default class ApiImplAndroidGenerator implements ApiImplGeneratable {
  public static getMustacheFileNamesMap(resourceDir: string, apiName: string) {
    const files = readDir(resourceDir, f => f.endsWith('.mustache'));
    const classNames: { [k: string]: string } = {
      'RequestHandlerConfig.java.mustache': 'RequestHandlerConfig.java',
      'RequestHandlerProvider.java.mustache': 'RequestHandlerProvider.java',
      'apiController.mustache': `${apiName}ApiController.java`,
      'requestHandlerProvider.mustache': `${apiName}ApiRequestHandlerProvider.java`,
      'requestHandlers.mustache': `${apiName}ApiRequestHandler.java`,
    };
    return { files, classNames };
  }

  private regenerateApiImpl: boolean;

  get name(): string {
    return 'ApiImplAndroidGenerator';
  }

  get platform(): string {
    return 'android';
  }

  public async generate(
    apiDependency: PackagePath,
    paths: any,
    reactNativeVersion: string,
    plugins: PackagePath[],
    apis: any[],
    regen: boolean,
  ) {
    log.debug(`Starting project generation for ${this.platform}`);
    this.regenerateApiImpl = regen;
    await this.fillHull(
      apiDependency,
      paths,
      reactNativeVersion,
      plugins,
      apis,
    );
  }

  public async fillHull(
    apiDependency: PackagePath,
    paths: any,
    reactNativeVersion: string,
    pluginsPaths: PackagePath[],
    apis: any[],
  ) {
    shell.pushd(ROOT_DIR);

    try {
      log.debug(
        `[=== Starting hull filling for api impl gen for ${this.platform} ===]`,
      );

      const outputDirectory = path.join(paths.outDirectory, 'android');
      log.debug(
        `Creating out directory(${outputDirectory}) for android and copying container hull to it.`,
      );

      fs.ensureDirSync(outputDirectory);

      fileUtils.chmodr('755', outputDirectory);
      shell.cp(
        '-Rf',
        path.join(paths.apiImplHull, 'android/{.*,*}'),
        outputDirectory,
      );

      const srcOutputDirectory = path.join(
        outputDirectory,
        'lib',
        SRC_MAIN_JAVA_DIR,
      );
      let pluginPath: PackagePath;
      for (pluginPath of pluginsPaths) {
        const pluginConfig = await manifest.getPluginConfig(
          pluginPath,
          'android',
        );
        if (pluginConfig) {
          log.debug(`Copying ${pluginPath.name} to ${outputDirectory}`);
          this.copyPluginToOutput(
            paths,
            srcOutputDirectory,
            pluginPath,
            pluginConfig,
          );
        }
      }
      const editableFiles = await this.generateRequestHandlerClasses(
        apiDependency,
        paths,
        apis,
      );
      await this.updateGradleProperties(paths, outputDirectory);
      await this.updateBuildGradle(paths, reactNativeVersion, outputDirectory);
    } finally {
      shell.popd();
    }
  }

  public copyPluginToOutput(
    paths: any,
    pluginOutputDirectory: string,
    pluginPath: PackagePath,
    pluginConfig: PluginConfig<'android'>,
  ) {
    if (pluginPath.name === 'react-native') {
      return;
    }
    log.debug(`injecting ${pluginPath.name} code.`);
    const pluginSrcDirectory = path.join(
      paths.outDirectory,
      'node_modules',
      pluginPath.name!,
      'android',
      pluginConfig.moduleName,
      SRC_MAIN_JAVA_DIR,
      '*',
    );

    fs.ensureDirSync(pluginOutputDirectory);

    log.debug(
      `Copying code from ${pluginSrcDirectory} to ${pluginOutputDirectory}`,
    );
    shell.cp('-Rf', pluginSrcDirectory, pluginOutputDirectory);
  }

  public updateBuildGradle(
    paths: any,
    reactNativeVersion: string,
    outputDirectory: string,
  ): Promise<any> {
    let mustacheView: any = {};
    const versions = android.resolveAndroidVersions({
      androidGradlePlugin: '3.2.1',
    });
    mustacheView.reactNativeVersion = reactNativeVersion;
    mustacheView = Object.assign(mustacheView, versions);
    mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, 'android/build.gradle'),
      mustacheView,
      path.join(outputDirectory, 'build.gradle'),
    );
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(paths.apiImplHull, 'android/lib/build.gradle'),
      mustacheView,
      path.join(outputDirectory, 'lib/build.gradle'),
    );
  }

  public updateGradleProperties(
    paths: any,
    outputDirectory: string,
  ): Promise<any> {
    let mustacheView: any = {};
    const versions = android.resolveAndroidVersions();
    mustacheView = Object.assign(mustacheView, versions);
    return mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
      path.join(
        paths.apiImplHull,
        'android/gradle/wrapper/gradle-wrapper.properties',
      ),
      mustacheView,
      path.join(outputDirectory, 'gradle/wrapper/gradle-wrapper.properties'),
    );
  }

  public async generateRequestHandlerClasses(
    apiDependency: PackagePath,
    paths: any,
    apis: any[],
  ) {
    log.debug('=== updating request handler implementation class ===');
    try {
      const editableFiles: string[] = [];
      const resourceDir = path.join(
        Platform.currentPlatformVersionPath,
        'ern-api-impl-gen/resources/android',
      );
      const outputDir = path.join(
        paths.outDirectory,
        'android/lib',
        SRC_MAIN_JAVA_DIR,
        API_IMPL_PACKAGE,
      );
      fs.ensureDirSync(outputDir);

      for (const api of apis) {
        const {
          files,
          classNames,
        } = ApiImplAndroidGenerator.getMustacheFileNamesMap(
          resourceDir,
          api.apiName,
        );
        for (const file of files) {
          if (file === 'requestHandlerProvider.mustache') {
            editableFiles.push(path.join(outputDir, classNames[file]));
            if (this.regenerateApiImpl) {
              log.debug(`Skipping regeneration of ${classNames[file]}`);
              continue;
            }
          }
          if (classNames[file]) {
            const partialProxy = (name: string) => {
              return fs.readFileSync(
                path.join(resourceDir, `${name}.mustache`),
                'utf8',
              );
            };
            await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
              path.join(resourceDir, file),
              api,
              path.join(outputDir, classNames[file]),
              partialProxy,
            );
          } else {
            log.info(`No mapping for for ${file}. Mustaching skipped.`);
          }
        }
        log.debug(
          `Api implementation files successfully generated for ${api.apiName}Api`,
        );
      }
      return editableFiles;
    } catch (e) {
      throw new Error(`Failed to update RequestHandlerClass: ${e}`);
    }
  }
}

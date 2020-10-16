import {
  AppVersionDescriptor,
  getDefaultMavenLocalDirectory,
  kax,
  log,
  MiniApp,
  NativePlatform,
  PackagePath,
  Platform,
  reactnative,
  shell,
  utils,
} from 'ern-core';
import { publishContainer } from 'ern-container-publisher';
import { getActiveCauldron } from 'ern-cauldron-api';
import { RunnerGeneratorConfig } from 'ern-runner-gen';
import { getRunnerGeneratorForPlatform } from './getRunnerGeneratorForPlatform';
import { generateContainerForRunner } from './generateContainerForRunner';
import { launchRunner } from './launchRunner';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { LaunchRunnerConfig } from 'ern-runner-gen/src/types/LaunchRunnerConfig';

export async function runMiniApp(
  platform: NativePlatform,
  {
    baseComposite,
    cwd,
    descriptor,
    dev,
    extra,
    host,
    jsApiImpls,
    launchArgs,
    launchEnvVars,
    launchFlags,
    mainMiniAppName,
    miniapps,
    port,
  }: {
    baseComposite?: PackagePath;
    cwd?: string;
    descriptor?: string | AppVersionDescriptor;
    dev?: boolean;
    extra?: any;
    host?: string;
    jsApiImpls?: PackagePath[];
    launchArgs?: string;
    launchEnvVars?: string;
    launchFlags?: string;
    mainMiniAppName?: string;
    miniapps?: PackagePath[];
    port?: string;
  } = {},
) {
  cwd = cwd ?? process.cwd();

  let napDescriptor: AppVersionDescriptor | undefined;

  if (miniapps && !MiniApp.existInPath(cwd) && !mainMiniAppName) {
    throw new Error(
      'If you run multiple MiniApps you need to provide the name of the MiniApp to launch',
    );
  }

  let jsMainModuleName;
  if (MiniApp.existInPath(cwd)) {
    jsMainModuleName = (await fs.pathExists(
      path.join(cwd, `index.${platform}.js`),
    ))
      ? `index.${platform}`
      : 'index';
  }

  if (miniapps && dev) {
    dev = false;
    log.warn(
      'Turning off dev mode since you are running multiple MiniApps. \nIf you want to start a packager, execute `ern start` command with all the miniapps in a separate terminal.\nCheck this link for more details: https://native.electrode.io/cli-commands/start',
    );
  }

  if (jsApiImpls && jsApiImpls.length > 0 && descriptor) {
    throw new Error(
      'You cannot pass JavaScript API implementations when using a Native Application Descriptor',
    );
  }

  if (miniapps && descriptor) {
    throw new Error('You cannot use miniapps and descriptor at the same time');
  }

  let cauldron;
  if (descriptor) {
    cauldron = await getActiveCauldron();
    napDescriptor = utils.coerceToAppVersionDescriptor(descriptor);
  }

  const compositeGenConfig =
    cauldron && (await cauldron.getCompositeGeneratorConfig(napDescriptor));
  baseComposite =
    baseComposite ||
    (compositeGenConfig?.baseComposite &&
      PackagePath.fromString(compositeGenConfig.baseComposite));

  let entryMiniAppName = mainMiniAppName || '';
  if (miniapps) {
    if (MiniApp.existInPath(cwd)) {
      const miniapp = MiniApp.fromPath(cwd);
      miniapps = miniapps.concat(PackagePath.fromString(`file:${cwd}`));
      log.debug(
        `This command is being run from the ${miniapp.name} MiniApp directory.`,
      );
      log.info(
        `All extra MiniApps will be included in the Runner container along with ${miniapp.name}`,
      );
      if (!mainMiniAppName) {
        log.info(`${miniapp.name} will be set as the main MiniApp`);
        log.info(
          `You can select another one instead through '--mainMiniAppName' option`,
        );
        entryMiniAppName = miniapp.name;
      }
    }
  } else if (!miniapps && !descriptor) {
    entryMiniAppName = MiniApp.fromCurrentPath().name;
    miniapps = [PackagePath.fromString(`file:${cwd}`)];
    log.debug(
      `This command is being run from the ${entryMiniAppName} MiniApp directory.`,
    );
    log.debug(`Initializing Runner`);

    if (dev) {
      await reactnative.startPackagerInNewWindow({
        cwd,
        host,
        port,
      });
    } else {
      log.info('Dev mode not enabled, will not start the packager.');
    }
  } else {
    miniapps =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerMiniApps(napDescriptor))) ||
      [];
  }

  if (descriptor) {
    jsApiImpls =
      (cauldron &&
        napDescriptor &&
        (await cauldron.getContainerJsApiImpls(napDescriptor))) ||
      [];
  }

  const outDir = Platform.getContainerGenOutDirectory(platform);
  const containerGenResult = await generateContainerForRunner(platform, {
    baseComposite,
    extra, // JavaScript object to pass extras e.x. androidConfig
    jsApiImpls,
    jsMainModuleName,
    miniApps: miniapps,
    napDescriptor: napDescriptor || undefined,
    outDir,
  });

  const pathToRunner = path.join(cwd, platform);
  const oldAndroidRunner = isOldAndroidRunner();

  if (platform === 'android') {
    if (oldAndroidRunner) {
      log.warn(
        'Looks like you are running on an older version of the android runner project generated using ern version < 0.38.0. \n We recommend that you delete your current Android directory and regenerate the new runner by executing `ern run-android` command again.',
      );
    }
    extra = extra || {};
    extra.androidConfig = {
      ...(extra && extra.androidConfig),
      artifactId: oldAndroidRunner
        ? `runner-ern-container`
        : `runner-ern-container-${entryMiniAppName.toLowerCase()}`,
      groupId: 'com.walmartlabs.ern',
      packageFilePath: oldAndroidRunner
        ? 'com/walmartlabs/ern'
        : `com/walmartlabs/ern/${entryMiniAppName.toLowerCase()}`,
      packageName: oldAndroidRunner
        ? `com.walmartlabs.ern`
        : `com.walmartlabs.ern.${entryMiniAppName.toLowerCase()}`,
    };
    await publishContainer({
      containerPath: outDir,
      containerVersion: '1.0.0',
      extra: extra.androidConfig,
      platform: 'android',
      publisher: PackagePath.fromString('ern-container-publisher-maven'),
      url: getDefaultMavenLocalDirectory(),
    });
  }

  const compositeNativeDeps = await containerGenResult.config.composite.getNativeDependencies(
    {},
  );
  const reactNativeDep = _.find(
    compositeNativeDeps.all,
    (p) => p.name === 'react-native',
  );

  const runnerGeneratorConfig: RunnerGeneratorConfig = {
    extra: {
      androidConfig: extra?.androidConfig ?? {},
      containerGenWorkingDir: Platform.containerGenDirectory,
      iosConfig: extra?.iosConfig ?? {},
    },
    mainMiniAppName: entryMiniAppName,
    outDir: pathToRunner,
    reactNativeDevSupportEnabled: dev,
    reactNativePackagerHost: host,
    reactNativePackagerPort: port,
    reactNativeVersion: reactNativeDep!.version!,
    targetPlatform: platform,
  };

  if (!(await fs.pathExists(pathToRunner))) {
    shell.mkdir('-p', pathToRunner);
    await kax
      .task(`Generating ${platform} Runner project`)
      .run(
        getRunnerGeneratorForPlatform(platform).generate(runnerGeneratorConfig),
      );
  } else {
    await kax
      .task(`Regenerating ${platform} Runner Configuration`)
      .run(
        getRunnerGeneratorForPlatform(platform).regenerateRunnerConfig(
          runnerGeneratorConfig,
        ),
      );
  }

  function isOldAndroidRunner(): boolean {
    const paths = path.join(
      pathToRunner,
      'app/src/main/java/com/walmartlabs/ern/RunnerConfig.java',
    );
    return fs.pathExistsSync(paths);
  }

  const launchRunnerConfig: LaunchRunnerConfig = {
    extra: {
      launchArgs,
      launchEnvVars,
      launchFlags,
    },
    pathToRunner,
    platform,
  };

  if (platform === 'android') {
    launchRunnerConfig.extra.packageName = extra.androidConfig.packageName;
  }

  await launchRunner(launchRunnerConfig);
}

import { sortDependenciesByName } from './sortDependenciesByName';
import { bundleMiniAppsFromComposite } from './bundleMiniApps';
import { copyRnpmAssets } from './copyRnpmAssets';
import { copyRnConfigAssets } from './copyRnConfigAssets';
import { addContainerMetadata } from './addContainerMetadata';
import { ContainerGeneratorConfig, ContainerGenResult } from './types';
import { BundlingResult, kax, shell } from 'ern-core';
import { executeBundleHooks } from './executeBundleHooks';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

type ContainerGeneratorAction = (
  config: ContainerGeneratorConfig,
) => Promise<any>;

type PostBundleAction = (
  config: ContainerGeneratorConfig,
  bundle: BundlingResult,
  reactNativeVersion: string,
) => Promise<any>;

export async function generateContainer(
  config: ContainerGeneratorConfig,
  {
    fillContainerHull,
    postCopyRnpmAssets,
    postBundle,
  }: {
    fillContainerHull?: ContainerGeneratorAction;
    postCopyRnpmAssets?: ContainerGeneratorAction;
    postBundle?: PostBundleAction;
  } = {},
): Promise<ContainerGenResult> {
  fs.ensureDirSync(config.outDir);
  shell.rm('-rf', path.join(config.outDir, '{.*,*}'));

  if (!config.plugins || config.plugins.length === 0) {
    config.plugins = await kax
      .task('Resolving native dependencies')
      .run(
        config.composite.getInjectableNativeDependencies(config.targetPlatform),
      );
  }

  config.plugins = sortDependenciesByName(config.plugins);

  const reactNativePlugin = _.find(
    config.plugins,
    (p) => p.name === 'react-native',
  );

  // React-native plugin should be first in the dependencies
  // Otherwise any module dependent on r-n won't be able to use it
  config.plugins = [
    ...(reactNativePlugin ? [reactNativePlugin] : []),
    ...config.plugins.filter((plugin) => plugin !== reactNativePlugin),
  ];

  shell.pushd(config.outDir);
  try {
    if (fillContainerHull) {
      await fillContainerHull(config);
    }
  } finally {
    shell.popd();
  }

  if (config?.hooks?.preBundle) {
    await executeBundleHooks(config?.hooks?.preBundle, config.composite.path);
  }

  const bundlingResult: BundlingResult = await kax
    .task('Bundling MiniApps')
    .run(
      bundleMiniAppsFromComposite({
        compositeDir: config.composite.path,
        dev: !!config.devJsBundle,
        outDir: config.outDir,
        platform: config.targetPlatform,
        resetCache: config.resetCache,
        sourceMapOutput: config.sourceMapOutput,
      }),
    );

  if (config?.hooks?.postBundle) {
    await executeBundleHooks(config?.hooks?.postBundle, config.outDir);
  }

  if (postBundle) {
    await postBundle(config, bundlingResult, reactNativePlugin?.version!);
  }

  const compositeMiniApps = await config.composite.getMiniApps();
  if (!config.ignoreRnpmAssets) {
    copyRnpmAssets(
      compositeMiniApps,
      config.composite.path,
      config.outDir,
      config.targetPlatform,
    );

    await copyRnConfigAssets({
      compositePath: config.composite.path,
      outDir: config.outDir,
      platform: config.targetPlatform,
    });

    if (postCopyRnpmAssets) {
      await postCopyRnpmAssets(config);
    }
  }

  await kax
    .task('Adding Electrode Native Metadata File')
    .run(addContainerMetadata(config));

  return {
    bundlingResult,
    config,
  };
}

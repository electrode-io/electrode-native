import {
  android,
  AppVersionDescriptor,
  config as ernConfig,
  createTmpDir,
  ErnBinaryStore,
  findNativeDependencies,
  ios,
  kax,
  log,
  nativeDepenciesVersionResolution,
  PackagePath,
  reactnative,
} from 'ern-core';
import { getActiveCauldron } from 'ern-cauldron-api';
import {
  createMetroConfig,
  GeneratedComposite,
  patchCompositeBabelRcRoots,
} from 'ern-composite-gen';
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

export default async function start({
  baseComposite,
  compositeDir,
  jsApiImpls,
  miniapps = [],
  descriptor,
  flavor,
  launchArgs,
  launchEnvVars,
  launchFlags,
  watchNodeModules = [],
  packageName,
  activityName,
  bundleId,
  extraJsDependencies,
  disableBinaryStore,
  host,
  port,
  resetCache,
}: {
  baseComposite?: PackagePath;
  compositeDir?: string;
  jsApiImpls?: PackagePath[];
  miniapps?: PackagePath[];
  descriptor?: AppVersionDescriptor;
  flavor?: string;
  launchArgs?: string;
  launchEnvVars?: string;
  launchFlags?: string;
  watchNodeModules?: string[];
  packageName?: string;
  activityName?: string;
  bundleId?: string;
  extraJsDependencies?: PackagePath[];
  disableBinaryStore?: boolean;
  host?: string;
  port?: string;
  resetCache?: boolean;
} = {}) {
  const cauldron = await getActiveCauldron({ throwIfNoActiveCauldron: false });
  if (!cauldron && descriptor) {
    throw new Error(
      'To use a native application descriptor, a Cauldron must be active',
    );
  }

  if (!miniapps && !jsApiImpls && !descriptor) {
    throw new Error(
      'Either miniapps, jsApiImpls or descriptor needs to be provided',
    );
  }

  let resolutions;
  if (descriptor) {
    miniapps = await cauldron.getContainerMiniApps(descriptor, {
      favorGitBranches: true,
    });
    const compositeGenConfig = await cauldron.getCompositeGeneratorConfig(
      descriptor,
    );
    baseComposite =
      baseComposite ??
      (compositeGenConfig?.baseComposite &&
        PackagePath.fromString(compositeGenConfig.baseComposite));

    resolutions = compositeGenConfig?.resolutions;
  }

  compositeDir = compositeDir || createTmpDir();
  log.trace(`Temporary composite directory is ${compositeDir}`);

  const miniAppsLinksObj = ernConfig.get('miniAppsLinks', {});
  const linkedMiniAppsPkgNames = Object.keys(miniAppsLinksObj).filter((p) =>
    fs.existsSync(miniAppsLinksObj[p]),
  );

  //
  // Replace all npm provided miniapps that have a linked directory,
  // with their linked directory
  const npmMiniAppsPkgNames: string[] = miniapps
    .filter((m) => m.isRegistryPath)
    .map((m) => m.name!);
  const npmMiniAppsLinkedPkgNames = _.intersection(
    linkedMiniAppsPkgNames,
    npmMiniAppsPkgNames,
  );
  _.remove(miniapps, (m) => npmMiniAppsLinkedPkgNames.includes(m.name!));
  npmMiniAppsLinkedPkgNames.forEach((pkgName) =>
    miniapps.push(miniAppsLinksObj[pkgName]),
  );

  const composite = await kax.task('Generating MiniApps composite').run(
    GeneratedComposite.generate({
      baseComposite,
      extraJsDependencies: extraJsDependencies || undefined,
      jsApiImplDependencies: jsApiImpls,
      miniApps: miniapps!,
      outDir: compositeDir,
      resolutions,
    }),
  );

  const compositeMiniApps = await composite.getMiniAppsPackages();

  // Only case we need to account for, is any miniapps passed to
  // start as git remotes which have a local linked directory
  const gitMiniApps = compositeMiniApps.filter((m) => m.packagePath.isGitPath);
  const gitMiniAppsPkgNames = gitMiniApps.map((r) => r.name);
  const gitMiniAppsLinkedPkgNames = _.intersection(
    linkedMiniAppsPkgNames,
    gitMiniAppsPkgNames,
  );
  const activeLinkedPkgPaths = gitMiniAppsLinkedPkgNames.map(
    (m) => miniAppsLinksObj[m],
  );
  if (gitMiniAppsLinkedPkgNames.length > 0) {
    const linkedMiniAppDeps = await findNativeDependencies(
      activeLinkedPkgPaths.map((p) => path.join(p, 'node_modules')),
    );
    const allNativeDeps = await composite.getNativeDependencies();
    // Exclude api/api impls as they are not native modules
    allNativeDeps.apis = [];
    allNativeDeps.nativeApisImpl = [];
    // Add the ones from composite
    allNativeDeps.thirdPartyInManifest.push(
      ...linkedMiniAppDeps.thirdPartyInManifest,
    );
    allNativeDeps.thirdPartyNotInManifest.push(
      ...linkedMiniAppDeps.thirdPartyNotInManifest,
    );
    allNativeDeps.all.push(...linkedMiniAppDeps.all);
    const allNativeModules = [
      ...allNativeDeps.thirdPartyInManifest,
      ...allNativeDeps.thirdPartyNotInManifest,
    ];
    const dedupedNativeModules = nativeDepenciesVersionResolution.resolveNativeDependenciesVersionsEx(
      allNativeDeps,
    );
    const extraNodeModules: { [pkg: string]: string } = {};
    dedupedNativeModules.resolved.forEach((m) => {
      extraNodeModules[m.name!] = m.basePath;
    });
    const blacklistRe = _.difference(
      allNativeModules.map((d) => d.basePath),
      dedupedNativeModules.resolved.map((d) => d.basePath),
    ).map(
      (l) =>
        new RegExp(
          os.platform() === 'win32'
            ? `${l}\\.*`.replace(/\\/g, '\\\\')
            : `${l}\/.*`,
        ),
    );

    const compositeLocalMiniappsPaths = compositeMiniApps
      .filter((m) => m.packagePath.isFilePath)
      .map((m) => m.path);

    const allLocalMiniAppsPaths = [
      ...compositeLocalMiniappsPaths,
      ...activeLinkedPkgPaths,
    ];

    await patchCompositeBabelRcRoots({
      cwd: composite.path,
      extraPaths: allLocalMiniAppsPaths,
    });
    await createMetroConfig({
      blacklistRe,
      cwd: composite.path,
      extraNodeModules,
      watchFolders: allLocalMiniAppsPaths,
    });
  }

  reactnative.startPackager({
    cwd: compositeDir,
    host,
    port,
    resetCache,
  });

  if (descriptor && !disableBinaryStore) {
    const binaryStoreConfig = await cauldron.getBinaryStoreConfig();
    if (binaryStoreConfig) {
      const cauldronStartCommandConfig = await cauldron.getStartCommandConfig(
        descriptor,
      );
      const binaryStore = new ErnBinaryStore(binaryStoreConfig);
      if (await binaryStore.hasBinary(descriptor, { flavor })) {
        if (descriptor.platform === 'android') {
          if (cauldronStartCommandConfig?.android) {
            packageName =
              packageName ?? cauldronStartCommandConfig.android.packageName;
            activityName =
              activityName ?? cauldronStartCommandConfig.android.activityName;
          }
          if (!packageName) {
            throw new Error(
              'You need to provide an Android package name or set it in Cauldron configuration',
            );
          }
          const apkPath = await kax
            .task('Downloading binary from store')
            .run(binaryStore.getBinary(descriptor, { flavor }));
          await android.runAndroidApk({
            activityName,
            apkPath,
            launchFlags,
            packageName,
          });
        } else if (descriptor.platform === 'ios') {
          if (cauldronStartCommandConfig?.ios) {
            bundleId = bundleId ?? cauldronStartCommandConfig.ios.bundleId;
          }
          if (!bundleId) {
            throw new Error(
              'You need to provide an iOS bundle ID or set it in Cauldron configuration',
            );
          }
          const appPath = await kax
            .task('Downloading binary from store')
            .run(binaryStore.getBinary(descriptor, { flavor }));
          await ios.runIosApp({ appPath, bundleId, launchArgs, launchEnvVars });
        }
      }
    }
  }
}

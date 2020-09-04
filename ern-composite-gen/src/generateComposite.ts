import {
  findNativeDependencies,
  gitCli,
  kax,
  log,
  nativeDepenciesVersionResolution,
  NativeDependencies,
  PackagePath,
  readPackageJson,
  shell,
  yarn,
} from 'ern-core';
import { cleanupCompositeDir } from './cleanupCompositeDir';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';
import _ from 'lodash';
import { CompositeGeneratorConfig } from './types';
import uuidv4 from 'uuid/v4';
import { addRNDepToPjson } from './addRNDepToPjson';
import { getNodeModuleVersion } from './getNodeModuleVersion';
import { addRNStartScriptToPjson } from './addRNStartScriptToPjson';
import { createIndexJs } from './createIndexJs';
import { createBaseCompositeImports } from './createBaseCompositeImports';
import { patchCompositeBabelRcRoots } from './patchCompositeBabelRcRoots';
import { patchMetro51AssetsBug } from './patchMetro51AssetsBug';
import { patchMetroAssetsBug } from './patchMetroAssetsBug';
import { patchMetroBabelEnv } from './patchMetroBabelEnv';
import { createBabelRc } from './createBabelRc';
import { applyYarnResolutions } from './applyYarnResolutions';
import { createMetroConfig } from './createMetroConfig';
import { createRNCliConfig } from './createRNCliConfig';
import { installPackages } from './installPackages';
import { installPackagesWithoutYarnLock } from './installPackagesWithoutYarnLock';
import { installExtraPackages } from './installExtraPackages';
import { createWatchmanConfig } from './createWatchmanConfig';
import Table from 'cli-table';
import os from 'os';

export async function generateComposite(config: CompositeGeneratorConfig) {
  log.debug(`generateComposite config : ${JSON.stringify(config, null, 2)}`);

  // Set env var ERN_BUGSNAG_CODE_BUNDLE_ID as a unique code bundle id for bugsnag
  process.env.ERN_BUGSNAG_CODE_BUNDLE_ID =
    process.env.ERN_BUGSNAG_CODE_BUNDLE_ID ?? uuidv4();

  if (
    config.miniApps.length === 0 &&
    (config.jsApiImplDependencies || []).length === 0
  ) {
    throw new Error(
      `At least one MiniApp or JS API implementation is needed to generate a composite`,
    );
  }

  return config.baseComposite
    ? generateCompositeFromBase(
        config.miniApps,
        config.outDir,
        config.baseComposite,
        {
          extraJsDependencies: config.extraJsDependencies,
          jsApiImplDependencies: config.jsApiImplDependencies,
        },
      )
    : generateFullComposite(config.miniApps, config.outDir, {
        extraJsDependencies: config.extraJsDependencies,
        jsApiImplDependencies: config.jsApiImplDependencies,
        pathToYarnLock: config.pathToYarnLock,
        resolutions: config.resolutions,
      });
}

async function generateCompositeFromBase(
  miniApps: PackagePath[],
  outDir: string,
  baseComposite: PackagePath,
  {
    extraJsDependencies = [],
    jsApiImplDependencies,
  }: {
    extraJsDependencies?: PackagePath[];
    jsApiImplDependencies?: PackagePath[];
  } = {},
) {
  if (baseComposite.isRegistryPath) {
    throw new Error(
      `baseComposite can only be a file or git path (${baseComposite})`,
    );
  }

  if ((await fs.pathExists(outDir)) && (await fs.readdir(outDir)).length > 0) {
    throw new Error(
      `${outDir} directory exists and is not empty.
Composite output directory should either not exist (it will be created) or should be empty.`,
    );
  } else {
    shell.mkdir('-p', outDir);
  }

  if (baseComposite.isGitPath) {
    await gitCli().clone(baseComposite.basePath, outDir);
    if (baseComposite.version) {
      await gitCli(outDir).checkout(baseComposite.version);
    }
  } else {
    shell.cp('-Rf', path.join(baseComposite.basePath, '{.*,*}'), outDir);
  }

  const jsPackages = jsApiImplDependencies
    ? [...miniApps, ...jsApiImplDependencies]
    : miniApps;

  shell.pushd(outDir);
  try {
    await installPackagesWithoutYarnLock({ cwd: outDir, jsPackages });
    await createBaseCompositeImports({ cwd: outDir });
    if (extraJsDependencies) {
      await installExtraPackages({ cwd: outDir, extraJsDependencies });
    }
  } finally {
    shell.popd();
  }
}

async function generateFullComposite(
  miniApps: PackagePath[],
  outDir: string,
  {
    extraJsDependencies = [],
    jsApiImplDependencies = [],
    pathToYarnLock,
    resolutions,
  }: {
    extraJsDependencies?: PackagePath[];
    jsApiImplDependencies?: PackagePath[];
    pathToYarnLock?: string;
    resolutions?: { [pkg: string]: string };
  } = {},
) {
  if (await fs.pathExists(outDir)) {
    await kax
      .task('Cleaning up existing composite directory')
      .run(cleanupCompositeDir(outDir));
  } else {
    shell.mkdir('-p', outDir);
  }

  shell.pushd(outDir);

  const remoteMiniapps = miniApps.filter((p) => !p.isFilePath);
  const localMiniApps = miniApps.filter((p) => p.isFilePath);
  const localMiniAppsPaths = localMiniApps.map((m) => m.basePath);
  const extraNodeModules: { [pkg: string]: string } = {};

  try {
    if (remoteMiniapps.length > 0) {
      // Only install remote miniapps coming from git/npm
      await installPackages({
        cwd: outDir,
        jsApiImplDependencies,
        miniApps: remoteMiniapps,
        pathToYarnLock,
      });
    } else {
      await yarn.init();
      // We need to install react-native in top level composite as it won't
      // transitively come with install of a miniapp in composite (we didn't
      // `yarn add` any miniapps as they are all local).
      // To know the version to install, we will just have a peak to one of
      // the miniapps, given that react native version is aligned across all.
      const pJson = await readPackageJson(localMiniAppsPaths[0]);
      const miniAppRnVersion = pJson.dependencies['react-native'];
      extraJsDependencies.push(
        PackagePath.fromString(`react-native@${miniAppRnVersion}`),
      );
      // We also need to keep react in the composite project root as
      // keeping it outside the root will lead to isses with versions of
      // react native <= 0.60.0 but also cause some side effect with
      // more recent react native version (one we identified has to do
      // with react hooks causing a red screen if react is not part of
      // the project root)
      const miniAppReactVersion = pJson.dependencies.react;
      extraJsDependencies.push(
        PackagePath.fromString(`react@${miniAppReactVersion}`),
      );
      // Also add latest version of the bridge
      extraJsDependencies.push(
        PackagePath.fromString(`react-native-electrode-bridge`),
      );
      extraJsDependencies = [...extraJsDependencies, ...jsApiImplDependencies];
    }

    // Explicitly add react as an extra node module in metro config
    // Because its not a native module, it will not be auto added
    // later on as done for native modules
    extraNodeModules.react = path.join(outDir, 'node_modules/react');

    await addRNStartScriptToPjson({ cwd: outDir });

    await createIndexJs({
      cwd: outDir,
      jsApiImplDependencies,
      miniApps,
    });

    await createWatchmanConfig({ cwd: outDir });

    await kax.task('Adding extra packages to the composite').run(
      installExtraPackages({
        cwd: outDir,
        extraJsDependencies: [
          PackagePath.fromString('ern-bundle-store-metro-asset-plugin'),
          PackagePath.fromString('react-native-svg-transformer'),
          ...extraJsDependencies,
        ],
      }),
    );

    if (resolutions) {
      // This function should be be called prior to applying
      // any file patches in node_modules, as it will run
      // `yarn install`, thus potentially clearing any previously
      // applied patches
      await applyYarnResolutions({ cwd: outDir, resolutions });
    }

    let blacklistRe: RegExp[] = [];
    if (localMiniApps.length > 0) {
      // If we have some local miniapps we need to do a few extra things.
      // Basically, we need to identify all native modules used by the local
      // miniapps, and build proper blacklistRe / extraNodeModules metro
      // config values.
      // What we want here, is for extraNodeModules to contain a local path
      // to each native module, and blacklist all other existing paths to
      // the native module to avoid duplication conflicts.
      const localMiniAppsNodeModulePaths = localMiniAppsPaths.map((p) =>
        path.join(p, 'node_modules'),
      );
      const allNativeDeps: NativeDependencies = await findNativeDependencies([
        path.join(outDir, 'node_modules'),
        ...localMiniAppsNodeModulePaths,
      ]);

      // Exclude api/api impls as they are not native modules
      allNativeDeps.apis = [];
      allNativeDeps.nativeApisImpl = [];
      const dedupedNativeModules = nativeDepenciesVersionResolution.resolveNativeDependenciesVersionsEx(
        allNativeDeps,
      );

      if (dedupedNativeModules.pluginsWithMismatchingVersions.length > 0) {
        let errorMsg = `Mismatching native module versions detected.
Native module(s) versions should be aligned across miniapps.
You should resolve the following version mismatches prior to retrying.${os.EOL}`;
        for (const pkgName of dedupedNativeModules.pluginsWithMismatchingVersions) {
          const mismatchingPkgs = allNativeDeps.all.filter(
            (x) => x.name === pkgName,
          );
          const table = new Table({
            head: ['path', 'version'],
          });
          mismatchingPkgs.forEach((pkg) =>
            table.push([pkg.fullPath, pkg.version]),
          );
          errorMsg += `${table.toString()}${os.EOL}`;
        }
        throw new Error(errorMsg);
      }

      const allNativeModules = [
        ...allNativeDeps.thirdPartyInManifest,
        ...allNativeDeps.thirdPartyNotInManifest,
      ];

      dedupedNativeModules.resolved.forEach((m) => {
        extraNodeModules[m.name!] = m.basePath;
      });

      blacklistRe = _.difference(
        allNativeModules.map((d) => d.basePath),
        dedupedNativeModules.resolved.map((d) => d.basePath),
      )
        .concat(
          ...localMiniAppsPaths.map((p) => path.join(p, 'node_modules/react')),
        )
        .map(
          (l) =>
            new RegExp(
              os.platform() === 'win32'
                ? `${l}\\.*`.replace(/\\/g, '\\\\')
                : `${l}\/.*`,
            ),
        );
    }

    await patchCompositeBabelRcRoots({
      cwd: outDir,
      extraPaths: localMiniAppsPaths,
    });
    await createBabelRc({ cwd: outDir, extraPaths: localMiniAppsPaths });
    await createMetroConfig({
      blacklistRe,
      cwd: outDir,
      extraNodeModules,
      watchFolders: localMiniAppsPaths,
    });
    const rnVersion = await getNodeModuleVersion({
      cwd: outDir,
      name: 'react-native',
    });
    if (semver.gte(rnVersion, '0.57.0')) {
      await createRNCliConfig({ cwd: outDir });
    }
    await addRNDepToPjson(outDir, rnVersion);
    if (semver.lt(rnVersion, '0.60.0')) {
      await patchMetro51AssetsBug({ cwd: outDir });
    }
    if (localMiniApps.length > 0) {
      // We only need to apply this patch if there is at least one local
      // MiniApp, as the bug it fixes only happens when dealing with
      // a monorepo like configuration. Such a configuration is only created
      // when at least one local MiniApp is present in the composite
      await patchMetroAssetsBug({ cwd: outDir });
    }
    await patchMetroBabelEnv({ cwd: outDir });
  } finally {
    shell.popd();
  }
}

import { generateComposite } from 'ern-composite-gen';
import { BundlingResult, kax, NativePlatform, PackagePath } from 'ern-core';
import { reactNativeBundleAndroid } from './reactNativeBundleAndroid';
import { reactNativeBundleIos } from './reactNativeBundleIos';

export async function bundleMiniApps(
  // The miniapps to be bundled
  miniApps: PackagePath[],
  compositeDir: string,
  outDir: string,
  platform: NativePlatform,
  {
    bundleOutput,
    pathToYarnLock,
    dev,
    sourceMapOutput,
    baseComposite,
    jsApiImplDependencies,
    resolutions,
    extraJsDependencies,
    resetCache,
  }: {
    bundleOutput?: string;
    pathToYarnLock?: string;
    dev?: boolean;
    sourceMapOutput?: string;
    baseComposite?: PackagePath;
    jsApiImplDependencies?: PackagePath[];
    resolutions?: { [pkg: string]: string };
    extraJsDependencies?: PackagePath[];
    resetCache?: boolean;
  } = {},
): Promise<BundlingResult> {
  await kax.task('Generating MiniApps Composite').run(
    generateComposite({
      baseComposite,
      extraJsDependencies,
      jsApiImplDependencies,
      miniApps,
      outDir: compositeDir,
      pathToYarnLock,
      resolutions,
    }),
  );

  return bundleMiniAppsFromComposite({
    bundleOutput,
    compositeDir,
    dev,
    outDir,
    platform,
    resetCache,
    sourceMapOutput,
  });
}

export async function bundleMiniAppsFromComposite({
  bundleOutput,
  compositeDir,
  dev,
  outDir,
  platform,
  resetCache,
  sourceMapOutput,
}: {
  bundleOutput?: string;
  compositeDir: string;
  dev?: boolean;
  outDir: string;
  platform: NativePlatform;
  resetCache?: boolean;
  sourceMapOutput?: string;
}): Promise<BundlingResult> {
  return kax.task('Running Metro Bundler').run(
    platform === 'android'
      ? reactNativeBundleAndroid({
          bundleOutput,
          cwd: compositeDir,
          dev,
          outDir,
          resetCache,
          sourceMapOutput,
        })
      : reactNativeBundleIos({
          bundleOutput,
          cwd: compositeDir,
          dev,
          outDir,
          resetCache,
          sourceMapOutput,
        }),
  );
}

import { generateComposite } from 'ern-composite-gen'
import { BundlingResult, kax, NativePlatform, PackagePath, log } from 'ern-core'
import { reactNativeBundleAndroid } from './reactNativeBundleAndroid'
import { reactNativeBundleIos } from './reactNativeBundleIos'
import { clearReactPackagerCache } from './clearReactPackagerCache'

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
    resolutions,
    extraJsDependencies,
  }: {
    bundleOutput?: string
    pathToYarnLock?: string
    dev?: boolean
    sourceMapOutput?: string
    baseComposite?: PackagePath
    resolutions?: { [pkg: string]: string }
    extraJsDependencies?: PackagePath[]
  } = {}
): Promise<BundlingResult> {
  await kax.task('Generating MiniApps Composite').run(
    generateComposite({
      baseComposite,
      extraJsDependencies,
      miniApps,
      outDir: compositeDir,
      pathToYarnLock,
      resolutions,
    })
  )

  return bundleMiniAppsFromComposite({
    bundleOutput,
    compositeDir,
    dev,
    outDir,
    platform,
    sourceMapOutput,
  })
}

export async function bundleMiniAppsFromComposite({
  bundleOutput,
  compositeDir,
  dev,
  outDir,
  platform,
  sourceMapOutput,
}: {
  bundleOutput?: string
  compositeDir: string
  dev?: boolean
  outDir: string
  platform: NativePlatform
  sourceMapOutput?: string
}): Promise<BundlingResult> {
  clearReactPackagerCache()

  return kax.task('Running Metro Bundler').run(
    platform === 'android'
      ? reactNativeBundleAndroid({
          bundleOutput,
          cwd: compositeDir,
          dev,
          outDir,
          sourceMapOutput,
        })
      : reactNativeBundleIos({
          bundleOutput,
          cwd: compositeDir,
          dev,
          outDir,
          sourceMapOutput,
        })
  )
}

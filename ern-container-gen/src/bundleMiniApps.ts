import { generateComposite } from 'ern-composite-gen'
import { BundlingResult, kax, NativePlatform, PackagePath } from 'ern-core'
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
    pathToYarnLock,
    dev,
    sourceMapOutput,
    baseComposite,
    jsApiImplDependencies,
  }: {
    pathToYarnLock?: string
    dev?: boolean
    sourceMapOutput?: string
    baseComposite?: PackagePath
    jsApiImplDependencies?: PackagePath[]
  } = {}
): Promise<BundlingResult> {
  await kax.task('Generating MiniApps Composite').run(
    generateComposite({
      baseComposite,
      jsApiImplDependencies,
      miniApps,
      outDir: compositeDir,
      pathToYarnLock,
    })
  )

  return bundleMiniAppsFromComposite({
    compositeDir,
    dev,
    outDir,
    platform,
    sourceMapOutput,
  })
}

export async function bundleMiniAppsFromComposite({
  compositeDir,
  dev,
  outDir,
  platform,
  sourceMapOutput,
}: {
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
          cwd: compositeDir,
          dev,
          outDir,
          sourceMapOutput,
        })
      : reactNativeBundleIos({
          cwd: compositeDir,
          dev,
          outDir,
          sourceMapOutput,
        })
  )
}

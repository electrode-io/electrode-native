import { generateComposite } from 'ern-composite-gen'
import { BundlingResult, kax, NativePlatform, PackagePath } from 'ern-core'
import { reactNativeBundleAndroid } from './reactNativeBundleAndroid'
import { reactNativeBundleIos } from './reactNativeBundleIos'
import { clearReactPackagerCache } from './clearReactPackagerCache'

export async function bundleMiniApps(
  // The miniapps to be bundled
  miniApps: PackagePath[],
  compositeMiniAppDir: string,
  outDir: string,
  platform: NativePlatform,
  {
    pathToYarnLock,
    dev,
    sourceMapOutput,
    baseComposite,
  }: {
    pathToYarnLock?: string
    dev?: boolean
    sourceMapOutput?: string
    baseComposite?: PackagePath
  } = {},
  // JavaScript API implementations
  jsApiImplDependencies?: PackagePath[]
): Promise<BundlingResult> {
  await kax.task('Generating MiniApps Composite').run(
    generateComposite({
      baseComposite,
      jsApiImplDependencies,
      miniApps,
      outDir: compositeMiniAppDir,
      pathToYarnLock,
    })
  )

  clearReactPackagerCache()

  return kax.task('Running Metro Bundler').run(
    platform === 'android'
      ? reactNativeBundleAndroid({
          dev,
          outDir,
          sourceMapOutput,
          workingDir: compositeMiniAppDir,
        })
      : reactNativeBundleIos({
          dev,
          outDir,
          sourceMapOutput,
          workingDir: compositeMiniAppDir,
        })
  )
}

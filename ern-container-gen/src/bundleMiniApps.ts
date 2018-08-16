import {
  BundlingResult,
  kax,
  MiniApp,
  NativePlatform,
  PackagePath,
} from 'ern-core'
import { reactNativeBundleAndroid } from './reactNativeBundleAndroid'
import { reactNativeBundleIos } from './reactNativeBundleIos'
import { clearReactPackagerCache } from './clearReactPackagerCache'
import { generateMiniAppsComposite } from './generateMiniAppsComposite'

export async function bundleMiniApps(
  // The miniapps to be bundled
  miniapps: MiniApp[],
  compositeMiniAppDir: string,
  outDir: string,
  platform: NativePlatform,
  {
    pathToYarnLock,
  }: {
    pathToYarnLock?: string
  } = {},
  // JavaScript API implementations
  jsApiImplDependencies?: PackagePath[]
): Promise<BundlingResult> {
  const miniAppsPaths: PackagePath[] = []
  for (const miniapp of miniapps) {
    miniAppsPaths.push(miniapp.packagePath)
  }

  await kax
    .task('Generating MiniApps Composite')
    .run(
      generateMiniAppsComposite(
        miniAppsPaths,
        compositeMiniAppDir,
        { pathToYarnLock },
        jsApiImplDependencies
      )
    )

  clearReactPackagerCache()

  return kax
    .task('Running Metro Bundler')
    .run(
      platform === 'android'
        ? reactNativeBundleAndroid({ workingDir: compositeMiniAppDir, outDir })
        : reactNativeBundleIos({ workingDir: compositeMiniAppDir, outDir })
    )
}

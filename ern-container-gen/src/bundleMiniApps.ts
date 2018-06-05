import {
  BundlingResult,
  log,
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
  try {
    log.debug('[=== Starting mini apps bundling ===]')

    const miniAppsPaths: PackagePath[] = []
    for (const miniapp of miniapps) {
      miniAppsPaths.push(miniapp.packagePath)
    }

    await generateMiniAppsComposite(
      miniAppsPaths,
      compositeMiniAppDir,
      { pathToYarnLock },
      jsApiImplDependencies
    )

    clearReactPackagerCache()

    let result: BundlingResult

    if (platform === 'android') {
      log.debug('Bundling miniapp(s) for Android')
      result = await reactNativeBundleAndroid(outDir)
    } else {
      log.debug('Bundling miniapp(s) for iOS')
      result = await reactNativeBundleIos(outDir)
    }

    log.debug('[=== Completed mini apps bundling ===]')

    return result
  } catch (e) {
    log.error(`[bundleMiniApps] Something went wrong: ${e}`)
    throw e
  }
}

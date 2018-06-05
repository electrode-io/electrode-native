import { MiniApp, NativePlatform } from 'ern-core'
import { copyAndroidRnpmAssetsFromMiniAppPath } from './copyAndroidRnpmAssetsFromMiniAppPath'
import { copyIosRnpmAssetsFromMiniAppPath } from './copyIosRnpmAssetsFromMiniAppPath'
import path from 'path'

export function copyRnpmAssets(
  miniApps: MiniApp[],
  compositeMiniAppDir: string,
  outDir: string,
  platform: NativePlatform
) {
  // Case of local container for runner
  if (miniApps.length === 1 && miniApps[0].path) {
    platform === 'android'
      ? copyAndroidRnpmAssetsFromMiniAppPath(miniApps[0].path, outDir)
      : copyIosRnpmAssetsFromMiniAppPath(miniApps[0].path, outDir)
  } else {
    for (const miniApp of miniApps) {
      const miniAppPath = path.join(
        compositeMiniAppDir,
        'node_modules',
        miniApp.packageJson.name
      )
      platform === 'android'
        ? copyAndroidRnpmAssetsFromMiniAppPath(miniAppPath, outDir)
        : copyIosRnpmAssetsFromMiniAppPath(miniAppPath, outDir)
    }
  }
}

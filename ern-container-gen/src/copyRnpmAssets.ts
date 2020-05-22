import {
  BaseMiniApp,
  handleCopyDirective,
  NativePlatform,
  readPackageJsonSync,
} from 'ern-core'
import { getAssetsPath } from './getAssetsPath'
import path from 'path'

export function copyRnpmAssets(
  miniApps: BaseMiniApp[],
  compositeMiniAppDir: string,
  outDir: string,
  platform: NativePlatform
) {
  const miniAppPaths =
    miniApps.length === 1 && miniApps[0].path
      ? [miniApps[0].path] // Case of local container for runner
      : miniApps.map(m => m.path)

  for (const miniAppPath of miniAppPaths) {
    const packageJson = readPackageJsonSync(miniAppPath)
    if (packageJson?.rnpm?.assets) {
      for (const assetDirectoryName of packageJson.rnpm.assets) {
        const source = path.join(assetDirectoryName, '*')
        const dest = getAssetsPath(platform, assetDirectoryName)
        handleCopyDirective(miniAppPath, outDir, [{ source, dest }])
      }
    }
  }
}

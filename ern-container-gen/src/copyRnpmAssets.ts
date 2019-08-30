import {
  MiniApp,
  NativePlatform,
  BaseMiniApp,
  readPackageJsonSync,
  handleCopyDirective,
} from 'ern-core'
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
      : miniApps.map(m =>
          path.normalize(
            `${compositeMiniAppDir}/node_modules/${m.packageJson.name}`
          )
        )

  for (const miniAppPath of miniAppPaths) {
    const packageJson = readPackageJsonSync(miniAppPath)
    if (packageJson.rnpm && packageJson.rnpm.assets) {
      for (const assetDirectoryName of packageJson.rnpm.assets) {
        const source = path.join(assetDirectoryName, '*')
        const dest =
          platform === 'android'
            ? path.normalize(
                `lib/src/main/assets/${assetDirectoryName.toLowerCase()}`
              )
            : path.normalize('ElectrodeContainer/Resources')
        handleCopyDirective(miniAppPath, outDir, [{ source, dest }])
      }
    }
  }
}

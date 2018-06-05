import { handleCopyDirective, readPackageJsonSync } from 'ern-core'
import fs from 'fs'
import path from 'path'

export function copyIosRnpmAssetsFromMiniAppPath(
  miniAppPath: string,
  outputPath: string
) {
  const packageJson = readPackageJsonSync(miniAppPath)
  if (packageJson.rnpm && packageJson.rnpm.assets) {
    for (const assetDirectoryName of packageJson.rnpm.assets) {
      const source = path.join(assetDirectoryName, '*')
      const dest = path.join('ElectrodeContainer', 'Resources')
      handleCopyDirective(miniAppPath, outputPath, [{ source, dest }])
    }
  }
}

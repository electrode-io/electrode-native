import {
  handleCopyDirective,
  NativePlatform,
  findDirectoriesHavingRnConfig,
  shell,
} from 'ern-core'
import { getAssetsPath } from './getAssetsPath'
import readDir from 'fs-readdir-recursive'
import path from 'path'

export const supportedAssetsExts = ['.ttf', '.otf']

/**
 * Copy in Container, the assets of all packages found in Composite,
 * that are exporting assets through react-native.config.js.
 * Similar to React Native, only fonts (.ttf/.otf) are supported for now.
 */
export async function copyRnConfigAssets({
  compositePath,
  outDir,
  platform,
}: {
  compositePath: string
  outDir: string
  platform: NativePlatform
}) {
  const dirs = await findDirectoriesHavingRnConfig(compositePath)

  for (const dir of dirs) {
    const rnConfig: any = require(path.join(dir, 'react-native.config.js'))
    if (rnConfig.dependency && rnConfig.dependency.assets) {
      for (const assetDir of rnConfig.dependency.assets) {
        const absDir = path.join(dir, assetDir)
        readDir(absDir)
          .filter(p => {
            return supportedAssetsExts.includes(path.extname(p))
          })
          .map(p => path.join(assetDir, p))
          .forEach(p => {
            handleCopyDirective(dir, outDir, [
              { source: p, dest: getAssetsPath(platform, 'fonts') },
            ])
          })
      }
    }
  }
}

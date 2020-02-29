import fs from 'fs-extra'
import path from 'path'
import { getNodeModuleVersion } from './getNodeModuleVersion'

export async function patchMetro51AssetsBug({ cwd }: { cwd: string }) {
  const metroVersion = await getNodeModuleVersion({
    cwd,
    name: 'metro',
  })
  const compositeNodeModulesPath = path.join(cwd, 'node_modules')
  // Only of use for RN < 0.60.0
  if (metroVersion === '0.51.1') {
    const pathToFileToPatch = path.join(
      compositeNodeModulesPath,
      'metro-resolver/src/resolve.js'
    )
    const stringToReplace = `const assetNames = resolveAsset(dirPath, fileNameHint, platform);`
    const replacementString = `let assetNames;
    try { assetNames = resolveAsset(dirPath, fileNameHint, platform); } catch (e) {}`
    const fileToPatch = await fs.readFile(pathToFileToPatch)
    const patchedFile = fileToPatch
      .toString()
      .replace(stringToReplace, replacementString)
    return fs.writeFile(pathToFileToPatch, patchedFile)
  }
}

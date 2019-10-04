import fs from 'fs-extra'
import path from 'path'

export async function cleanupCompositeDir(dir: string) {
  const filesAndDirsToRemove = [
    '.babelrc',
    'index.android.js',
    'index.ios.js',
    'index.js',
    'node_modules',
    'package.json',
    'yarn.lock',
  ].map(p => path.join(dir, p))

  for (const p of filesAndDirsToRemove) {
    await fs.remove(p)
  }
}

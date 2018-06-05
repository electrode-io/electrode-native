import { shell } from 'ern-core'
import path from 'path'

export function cleanupMiniAppsCompositeDir(dir: string) {
  shell.rm(
    '-rf',
    [
      '.babelrc',
      'index.android.js',
      'index.ios.js',
      'node_modules',
      'package.json',
      'yarn.lock',
    ].map(file => path.join(dir, file))
  )
}

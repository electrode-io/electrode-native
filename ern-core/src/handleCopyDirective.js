// @flow

import fs from 'fs'
import shell from './shell'
import path from 'path'

export default function handleCopyDirective (
  sourceRoot: string,
  destRoot: string,
  arr: Array<any>) {
  for (const cp of arr) {
    const sourcePath = path.join(sourceRoot, cp.source)
    const destPath = path.join(destRoot, cp.dest)
    if (!fs.existsSync(destPath)) {
      shell.mkdir('-p', destPath)
    }
    shell.cp('-R', sourcePath, destPath)
  }
}

// @flow

import fs from 'fs'
import {
  shell
} from 'ern-util'

export default function handleCopyDirective (
  sourceRoot: string,
  destRoot: string,
  arr: Array<any>) {
  for (const cp of arr) {
    const sourcePath = `${sourceRoot}/${cp.source}`
    const destPath = `${destRoot}/${cp.dest}`
    if (!fs.existsSync(destPath)) {
      shell.mkdir('-p', destPath)
    }
    shell.cp('-R', sourcePath, destPath)
  }
}

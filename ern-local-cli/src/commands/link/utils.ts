import fs from 'fs'
import path from 'path'
import { readPackageJson } from 'ern-core'

export async function getCurrentDirectoryPackageName() {
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    throw new Error(
      `No package.json found in current directory. 
This command should be run from a directory containing a Node package project.`
    )
  }
  const pjson = await readPackageJson(process.cwd())
  return pjson.name
}

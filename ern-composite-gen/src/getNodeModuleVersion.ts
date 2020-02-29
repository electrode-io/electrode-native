import path from 'path'
import fs from 'fs-extra'
import { readPackageJson } from 'ern-core'

export async function getNodeModuleVersion({
  cwd,
  name,
}: {
  cwd: string
  name: string
}) {
  const pathToModule = path.join(cwd, `node_modules/${name}`)
  if (!(await fs.pathExists(pathToModule))) {
    throw new Error(`Path ${pathToModule} not found`)
  }
  const pJson = await readPackageJson(pathToModule)
  return pJson.version
}

import fs from 'fs-extra'
import path from 'path'

export async function listDirsRecursive(rootDir) {
  const res: string[] = []
  const curDir = await fs.readdir(rootDir)
  const directories = curDir
    .map(p => path.join(rootDir, p))
    .filter(p => fs.statSync(p).isDirectory())
  res.push(...directories)
  for (const d of directories) {
    res.push(...(await listDirsRecursive(d)))
  }
  return res
}

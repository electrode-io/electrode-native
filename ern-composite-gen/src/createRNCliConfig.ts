import fs from 'fs-extra'
import path from 'path'

export async function createRNCliConfig({ cwd }: { cwd: string }) {
  const sourceExts =
    "module.exports = { resolver: { sourceExts: ['jsx', 'js', 'ts', 'tsx', 'mjs'] } };"
  await fs.writeFile(path.join(cwd, 'rn-cli.config.js'), sourceExts)
}

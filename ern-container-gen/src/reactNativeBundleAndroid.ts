import { BundlingResult, log, reactnative, shell } from 'ern-core'
import fs from 'fs'
import path from 'path'

export async function reactNativeBundleAndroid({
  bundleOutput,
  dev,
  outDir,
  sourceMapOutput,
  cwd,
}: {
  bundleOutput?: string
  dev?: boolean
  outDir: string
  sourceMapOutput?: string
  cwd?: string
}): Promise<BundlingResult> {
  cwd = cwd ?? process.cwd()
  const libSrcMainPath = path.join(outDir, 'lib', 'src', 'main')
  bundleOutput =
    bundleOutput ?? path.join(libSrcMainPath, 'assets', 'index.android.bundle')
  const assetsDest = path.join(libSrcMainPath, 'res')
  // Cleanup everything from 'res' directory but 'devassist'
  if (fs.existsSync(assetsDest)) {
    fs.readdirSync(assetsDest)
      .filter(p => p !== 'devassist')
      .map(p => path.join(assetsDest, p))
      .forEach(p => shell.rm('-rf', p))
  }

  shell.pushd(cwd)

  const entryFile = fs.existsSync(path.join(cwd, 'index.android.js'))
    ? 'index.android.js'
    : 'index.js'

  try {
    const result = await reactnative.bundle({
      assetsDest,
      bundleOutput,
      dev: !!dev,
      entryFile,
      platform: 'android',
      sourceMapOutput,
    })
    return result
  } finally {
    shell.popd()
  }
}

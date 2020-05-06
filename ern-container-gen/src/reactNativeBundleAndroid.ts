import { BundlingResult, log, reactnative, shell } from 'ern-core'
import fs from 'fs'
import path from 'path'

export async function reactNativeBundleAndroid({
  bundleOutput,
  dev,
  outDir,
  sourceMapOutput,
  cwd,
  resetCache,
}: {
  bundleOutput?: string
  dev?: boolean
  outDir: string
  sourceMapOutput?: string
  cwd?: string
  resetCache?: boolean
}): Promise<BundlingResult> {
  cwd = cwd ?? process.cwd()
  const libSrcMainPath = path.join(outDir, 'lib', 'src', 'main')
  bundleOutput =
    bundleOutput ?? path.join(libSrcMainPath, 'assets', 'index.android.bundle')
  const assetsDest = path.join(libSrcMainPath, 'res', 'bundle')

  // Cleanup everything from 'res' bundle directory
  if (fs.existsSync(assetsDest)) {
    shell.rm('-rf', assetsDest)
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
      resetCache,
      sourceMapOutput,
    })
    return result
  } finally {
    shell.popd()
  }
}

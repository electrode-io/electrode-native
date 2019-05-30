import { BundlingResult, reactnative, shell } from 'ern-core'
import fs from 'fs'
import path from 'path'

export async function reactNativeBundleAndroid({
  dev,
  outDir,
  sourceMapOutput,
  cwd,
}: {
  dev?: boolean
  outDir: string
  sourceMapOutput?: string
  cwd?: string
}): Promise<BundlingResult> {
  cwd = cwd || process.cwd()
  const libSrcMainPath = path.join(outDir, 'lib', 'src', 'main')
  const bundleOutput = path.join(
    libSrcMainPath,
    'assets',
    'index.android.bundle'
  )
  const assetsDest = path.join(libSrcMainPath, 'res')
  if (fs.existsSync(assetsDest)) {
    shell.rm('-rf', path.join(assetsDest, '{.*,*}'))
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

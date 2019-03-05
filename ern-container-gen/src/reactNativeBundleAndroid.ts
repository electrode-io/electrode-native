import { BundlingResult, reactnative, shell } from 'ern-core'
import fs from 'fs'
import path from 'path'

export async function reactNativeBundleAndroid({
  dev,
  outDir,
  sourceMapOutput,
  workingDir,
}: {
  dev?: boolean
  outDir: string
  sourceMapOutput?: string
  workingDir?: string
}): Promise<BundlingResult> {
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

  if (workingDir) {
    shell.pushd(workingDir)
  }
  try {
    const result = await reactnative.bundle({
      assetsDest,
      bundleOutput,
      dev: !!dev,
      entryFile: 'index.android.js',
      platform: 'android',
      sourceMapOutput,
    })
    return result
  } finally {
    if (workingDir) {
      shell.popd()
    }
  }
}

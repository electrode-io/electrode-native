import { BundlingResult, reactnative, shell } from 'ern-core'
import path from 'path'

export async function reactNativeBundleAndroid({
  workingDir,
  outDir,
}: {
  workingDir?: string
  outDir: string
}): Promise<BundlingResult> {
  if (!outDir) {
    throw new Error(
      '[reactNativeBundleAndroid] missing mandatory outDir parameter'
    )
  }
  const libSrcMainPath = path.join(outDir, 'lib', 'src', 'main')
  const bundleOutput = path.join(
    libSrcMainPath,
    'assets',
    'index.android.bundle'
  )
  const assetsDest = path.join(libSrcMainPath, 'res')

  if (workingDir) {
    shell.pushd(workingDir)
  }
  try {
    const result = await reactnative.bundle({
      assetsDest,
      bundleOutput,
      dev: false,
      entryFile: 'index.android.js',
      platform: 'android',
    })
    return result
  } finally {
    if (workingDir) {
      shell.popd()
    }
  }
}

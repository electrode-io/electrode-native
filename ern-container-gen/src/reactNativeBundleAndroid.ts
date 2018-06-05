import { BundlingResult, reactnative, shell } from 'ern-core'
import path from 'path'

export async function reactNativeBundleAndroid(
  outDir: string
): Promise<BundlingResult> {
  const libSrcMainPath = path.join(outDir, 'lib', 'src', 'main')
  const bundleOutput = path.join(
    libSrcMainPath,
    'assets',
    'index.android.bundle'
  )
  const assetsDest = path.join(libSrcMainPath, 'res')

  return reactnative.bundle({
    assetsDest,
    bundleOutput,
    dev: false,
    entryFile: 'index.android.js',
    platform: 'android',
  })
}

import { BundlingResult, reactnative, shell } from 'ern-core'
import fs from 'fs'
import path from 'path'

export async function reactNativeBundleIos({
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
  const miniAppOutPath = path.join(
    outDir,
    'ElectrodeContainer',
    'Libraries',
    'MiniApp'
  )
  const bundleOutput = path.join(miniAppOutPath, 'MiniApp.jsbundle')
  const assetsDest = miniAppOutPath

  if (!fs.existsSync(miniAppOutPath)) {
    shell.mkdir('-p', miniAppOutPath)
  }

  if (workingDir) {
    shell.pushd(workingDir)
  }
  try {
    const result = await reactnative.bundle({
      assetsDest,
      bundleOutput,
      dev: false,
      entryFile: 'index.ios.js',
      platform: 'ios',
    })
    return result
  } finally {
    if (workingDir) {
      shell.popd()
    }
  }
}

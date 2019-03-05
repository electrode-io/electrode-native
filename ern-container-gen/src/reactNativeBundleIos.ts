import { BundlingResult, reactnative, shell } from 'ern-core'
import fs from 'fs'
import path from 'path'

export async function reactNativeBundleIos({
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
  const miniAppOutPath = path.join(
    outDir,
    'ElectrodeContainer',
    'Libraries',
    'MiniApp'
  )
  const bundleOutput = path.join(miniAppOutPath, 'MiniApp.jsbundle')
  const assetsDest = miniAppOutPath
  if (fs.existsSync(assetsDest)) {
    shell.rm('-rf', path.join(assetsDest, '{.*,*}'))
    shell.mkdir('-p', path.join(assetsDest, 'assets'))
  }

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
      dev: !!dev,
      entryFile: 'index.ios.js',
      platform: 'ios',
      sourceMapOutput,
    })
    return result
  } finally {
    if (workingDir) {
      shell.popd()
    }
  }
}

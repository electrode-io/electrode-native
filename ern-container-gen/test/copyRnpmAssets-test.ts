import { copyRnpmAssets } from '../src/copyRnpmAssets'
import { BaseMiniApp, createTmpDir, PackagePath } from 'ern-core'
import { assert } from 'chai'
import fs from 'fs'
import path from 'path'

describe('copyRnpmAssets', () => {
  it('should not copy anything to output directory if the MiniApp package.json does not declare any rnpm assets [android]', () => {
    const miniAppPath = path.join(
      __dirname,
      'fixtures/MiniAppWithoutRnpmAssets'
    )
    const outDir = createTmpDir()
    copyRnpmAssets(
      [
        new BaseMiniApp({
          miniAppPath,
          packagePath: PackagePath.fromString(
            'miniapp-without-rnpm-assets@1.0.0'
          ),
        }),
      ],
      '',
      outDir,
      'android'
    )
    const files = fs.readdirSync(outDir)
    assert(!files.length)
  })

  it('should not copy anything to output directory if the MiniApp package.json does not declare any rnpm assets [ios]', () => {
    const miniAppPath = path.join(
      __dirname,
      'fixtures/MiniAppWithoutRnpmAssets'
    )
    const outDir = createTmpDir()
    copyRnpmAssets(
      [
        new BaseMiniApp({
          miniAppPath,
          packagePath: PackagePath.fromString(
            'miniapp-without-rnpm-assets@1.0.0'
          ),
        }),
      ],
      '',
      outDir,
      'ios'
    )
    const files = fs.readdirSync(outDir)
    assert(!files.length)
  })

  it('should copy assets to output directory if the MiniApp package.json declares rnpm assets [android]', () => {
    const miniAppPath = path.join(__dirname, 'fixtures/MiniAppWithRnpmAssets')
    const outDir = createTmpDir()
    copyRnpmAssets(
      [
        new BaseMiniApp({
          miniAppPath,
          packagePath: PackagePath.fromString('miniapp-with-rnpm-assets@1.0.0'),
        }),
      ],
      '',
      outDir,
      'android'
    )
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/lib/src/main/assets/fonts/fakefont1.ttf`)
      )
    )
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/lib/src/main/assets/fonts/fakefont2.ttf`)
      )
    )
  })

  it('should copy assets to output directory if the MiniApp package.json declares rnpm assets [ios]', () => {
    const miniAppPath = path.join(__dirname, 'fixtures/MiniAppWithRnpmAssets')
    const outDir = createTmpDir()
    copyRnpmAssets(
      [
        new BaseMiniApp({
          miniAppPath,
          packagePath: PackagePath.fromString('miniapp-with-rnpm-assets@1.0.0'),
        }),
      ],
      '',
      outDir,
      'ios'
    )
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/ElectrodeContainer/Resources/fakefont1.ttf`)
      )
    )
    assert(
      fs.existsSync(
        path.normalize(`${outDir}/ElectrodeContainer/Resources/fakefont2.ttf`)
      )
    )
  })
})

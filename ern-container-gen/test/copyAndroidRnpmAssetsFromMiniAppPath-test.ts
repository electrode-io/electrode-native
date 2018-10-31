import { copyAndroidRnpmAssetsFromMiniAppPath } from '../src/copyAndroidRnpmAssetsFromMiniAppPath'
import { createTmpDir } from 'ern-core'
import { assert } from 'chai'
import fs from 'fs'
import path from 'path'

describe('copyAndroidRnpmAssetsFromMiniAppPath', () => {
  it('should not copy anything to output directory if the MiniApp package.json does not declare any rnpm assets', () => {
    const miniAppDir = path.join(
      __dirname,
      'fixtures',
      'MiniAppWithoutRnpmAssets'
    )
    const outDir = createTmpDir()
    copyAndroidRnpmAssetsFromMiniAppPath(miniAppDir, outDir)
    const files = fs.readdirSync(outDir)
    assert(!files.length)
  })

  it('should copy assets to output directory if the MiniApp package.json declares rnpm assets', () => {
    const miniAppDir = path.join(__dirname, 'fixtures', 'MiniAppWithRnpmAssets')
    const outDir = createTmpDir()
    copyAndroidRnpmAssetsFromMiniAppPath(miniAppDir, outDir)
    assert(
      fs.existsSync(
        path.join(
          outDir,
          'lib',
          'src',
          'main',
          'assets',
          'fonts',
          'fakefont1.ttf'
        )
      )
    )
    assert(
      fs.existsSync(
        path.join(
          outDir,
          'lib',
          'src',
          'main',
          'assets',
          'fonts',
          'fakefont2.ttf'
        )
      )
    )
  })
})

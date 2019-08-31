import { copyRnConfigAssets } from '../src/copyRnConfigAssets'
import { BaseMiniApp, createTmpDir, PackagePath } from 'ern-core'
import { assert } from 'chai'
import fs from 'fs'
import path from 'path'

describe('copyRnConfigAssets', () => {
  it('should copy assets to output directory [android]', async () => {
    const compositePath = path.join(
      __dirname,
      'fixtures',
      'CompositeWithRnConfigs'
    )
    const outDir = createTmpDir()
    await copyRnConfigAssets({ compositePath, outDir, platform: 'android' })
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

  it('should copy assets to output directory [ios]', async () => {
    const compositePath = path.join(
      __dirname,
      'fixtures',
      'CompositeWithRnConfigs'
    )
    const outDir = createTmpDir()
    await copyRnConfigAssets({ compositePath, outDir, platform: 'ios' })
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

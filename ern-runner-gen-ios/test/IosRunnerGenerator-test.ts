import IosRunnerGenerator from '../src/IosRunnerGenerator'
import path from 'path'
import shell from 'shelljs'
import { assert } from 'chai'
import { sameDirContent } from 'ern-util-dev'
import os from 'os'
import { getRunnerGeneratorForPlatform } from 'ern-orchestrator'

describe('IosRunnerGenerator', () => {
  const simpleIosRunnerTestGeneratedPath = path.join(
    __dirname,
    'generated/simple-ios-runner'
  )
  const simpleIosRunnerFixturePath = path.join(
    __dirname,
    'fixtures/simple-ios-runner'
  )

  before(function() {
    if (os.platform() === 'win32') {
      this.skip()
      return
    }
    // Recreate the directory where tests will generate the runner
    shell.rm('-rf', simpleIosRunnerTestGeneratedPath)
    shell.mkdir('-p', simpleIosRunnerTestGeneratedPath)
  })

  it('should generate simple-ios-runner fixture given same configuration ', async () => {
    await getRunnerGeneratorForPlatform('ios').generate({
      extra: {
        containerGenWorkingDir: '/path/to/container',
      },
      mainMiniAppName: 'dummy',
      outDir: simpleIosRunnerTestGeneratedPath,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'ios',
    })
    assert(
      sameDirContent(
        simpleIosRunnerFixturePath,
        simpleIosRunnerTestGeneratedPath,
        []
      ),
      'Generated iOS Runner project differs from simple-ios-runner fixture'
    )
  })

  it('should re-generate configuration of simple-ios-runner fixture given same configuration ', async () => {
    await getRunnerGeneratorForPlatform('ios').regenerateRunnerConfig({
      extra: {
        containerGenWorkingDir: '/path/to/container',
      },
      mainMiniAppName: 'dummy',
      outDir: simpleIosRunnerTestGeneratedPath,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'ios',
    })
    assert(
      sameDirContent(
        simpleIosRunnerFixturePath,
        simpleIosRunnerTestGeneratedPath,
        []
      ),
      'Generated iOS Runner project differs from simple-ios-runner fixture'
    )
  })
})

import IosRunnerGenerator from '../src/IosRunnerGenerator'
import path from 'path'
import shell from 'shelljs'
import { assert } from 'chai'
import { sameDirContent } from 'ern-util-dev'

describe('IosRunnerGenerator', () => {
  const simpleIosRunnerTestGeneratedPath = path.join(
    __dirname,
    'generated',
    'simple-ios-runner'
  )
  const simpleIosRunnerFixturePath = path.join(
    __dirname,
    'fixtures',
    'simple-ios-runner'
  )

  before(() => {
    // Recreate the directory where tests will generate the runner
    shell.rm('-rf', simpleIosRunnerTestGeneratedPath)
    shell.mkdir('-p', simpleIosRunnerTestGeneratedPath)
  })

  it('should generate simple-ios-runner fixture given same configuration ', async () => {
    const sut = new IosRunnerGenerator()
    await sut.generate({
      extra: {
        containerGenWorkingDir: '/path/to/container',
      },
      mainMiniAppName: 'dummy',
      outDir: simpleIosRunnerTestGeneratedPath,
      targetPlatform: 'ios',
    })
    assert(
      sameDirContent(
        simpleIosRunnerFixturePath,
        simpleIosRunnerTestGeneratedPath,
        []
      ),
      'Generated Ios Runner project differs from simple-ios-runner fixture'
    )
  })

  it('should re-generate configuration of simple-ios-runner fixture given same configuration ', async () => {
    const sut = new IosRunnerGenerator()
    await sut.regenerateRunnerConfig({
      extra: {
        containerGenWorkingDir: '/path/to/container',
      },
      mainMiniAppName: 'dummy',
      outDir: simpleIosRunnerTestGeneratedPath,
      targetPlatform: 'ios',
    })
    assert(
      sameDirContent(
        simpleIosRunnerFixturePath,
        simpleIosRunnerTestGeneratedPath,
        []
      ),
      'Generated Ios Runner project differs from simple-ios-runner fixture'
    )
  })
})

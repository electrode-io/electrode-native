import path from 'path'
import { assert } from 'chai'
import { sameDirContent } from 'ern-util-dev'
import os from 'os'
import { RunnerGeneratorConfig } from 'ern-runner-gen'
import { IosRunnerGenerator } from 'ern-runner-gen-ios'
import tmp from 'tmp'

describe('IosRunnerGenerator', () => {
  const fixtureRunnerPath = path.join(
    __dirname,
    'fixtures',
    'simple-ios-runner'
  )
  const generatedRunnerPath = tmp.dirSync({ unsafeCleanup: true }).name
  process.chdir(generatedRunnerPath)

  const runnerConfig: RunnerGeneratorConfig = {
    extra: {
      containerGenWorkingDir: '/path/to/container',
    },
    mainMiniAppName: 'dummy',
    outDir: generatedRunnerPath,
    reactNativeVersion: '0.59.8',
    targetPlatform: 'ios',
  }

  before(function() {
    if (os.platform() !== 'darwin') {
      this.skip()
      return
    }
  })

  it('should generate simple-ios-runner fixture given same configuration ', async () => {
    await new IosRunnerGenerator().generate(runnerConfig)
    assert(
      sameDirContent(fixtureRunnerPath, generatedRunnerPath),
      'Generated iOS Runner project differs from simple-ios-runner fixture'
    )
  })

  it('should re-generate configuration of simple-ios-runner fixture given same configuration ', async () => {
    await new IosRunnerGenerator().regenerateRunnerConfig(runnerConfig)
    assert(
      sameDirContent(fixtureRunnerPath, generatedRunnerPath),
      'Generated iOS Runner project differs from simple-ios-runner fixture'
    )
  })
})

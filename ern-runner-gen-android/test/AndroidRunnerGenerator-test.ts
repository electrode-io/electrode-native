import path from 'path'
import shell from 'shelljs'
import { assert } from 'chai'
import { sameDirContent } from 'ern-util-dev'
import { getRunnerGeneratorForPlatform } from 'ern-orchestrator'

describe('AndroidRunnerGenerator', () => {
  const simpleAndroidRunnerTestGeneratedPath = path.join(
    __dirname,
    'generated',
    'simple-android-runner'
  )
  const simpleAndroidRunnerFixturePath = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner'
  )

  before(() => {
    // Recreate the directory where tests will generate the runner
    shell.rm('-rf', simpleAndroidRunnerTestGeneratedPath)
    shell.mkdir('-p', simpleAndroidRunnerTestGeneratedPath)
  })

  it('should generate simple-android-runner fixture given same configuration ', async () => {
    await getRunnerGeneratorForPlatform('android').generate({
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-dummy',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/dummy',
          packageName: 'com.walmartlabs.ern.dummy',
        },
      },
      mainMiniAppName: 'dummy',
      outDir: simpleAndroidRunnerTestGeneratedPath,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'android',
    })
    assert(
      sameDirContent(
        simpleAndroidRunnerFixturePath,
        simpleAndroidRunnerTestGeneratedPath,
        []
      ),
      'Generated Android Runner project differs from simple-android-runner fixture'
    )
  })

  it('should re-generate configuration of simple-android-runner fixture given same configuration ', async () => {
    await getRunnerGeneratorForPlatform('android').regenerateRunnerConfig({
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-dummy',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/dummy',
          packageName: 'com.walmartlabs.ern.dummy',
        },
      },
      mainMiniAppName: 'dummy',
      outDir: simpleAndroidRunnerTestGeneratedPath,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'android',
    })
    assert(
      sameDirContent(
        simpleAndroidRunnerFixturePath,
        simpleAndroidRunnerTestGeneratedPath,
        []
      ),
      'Generated Android Runner project differs from simple-android-runner fixture'
    )
  })
})

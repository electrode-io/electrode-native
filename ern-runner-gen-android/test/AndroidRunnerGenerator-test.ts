import path from 'path'
import shell from 'shelljs'
import { assert } from 'chai'
import { sameDirContent } from 'ern-util-dev'
import generateFixtures from '../src/utils/generatorHelper'

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
    await generateFixtures(
      'dummy',
      simpleAndroidRunnerTestGeneratedPath,
      'android'
    )
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
    await generateFixtures(
      'dummy',
      simpleAndroidRunnerTestGeneratedPath,
      'android'
    )
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

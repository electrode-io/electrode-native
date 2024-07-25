import path from 'path';
import tmp from 'tmp';
import { assert } from 'chai';
import { sameDirContent } from 'ern-util-dev';
import { AndroidRunnerGenerator } from 'ern-runner-gen-android';
import { RunnerGeneratorConfig } from 'ern-runner-gen';

describe('Test AndroidRunnerGenerator for RN version 0.67.x', () => {
  const fixtureRunnerPath = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner-rn-67',
  );
  const generatedRunnerPath = tmp.dirSync({ unsafeCleanup: true }).name;
  process.chdir(generatedRunnerPath);

  const generatorConfig: RunnerGeneratorConfig = {
    extra: {
      androidConfig: {
        artifactId: 'runner-ern-container-dummy',
        groupId: 'com.walmartlabs.ern',
        packageFilePath: 'com/walmartlabs/ern/dummy',
        packageName: 'com.walmartlabs.ern.dummy',
      },
    },
    mainMiniAppName: 'dummy',
    outDir: generatedRunnerPath,
    reactNativeVersion: '0.67.0',
    targetPlatform: 'android',
  };

  it('should generate simple-android-runner fixture given same configuration', async () => {
    await new AndroidRunnerGenerator().generate(generatorConfig);
    assert(
      sameDirContent(fixtureRunnerPath, generatedRunnerPath),
      'Generated Android Runner project differs from simple-android-runner fixture',
    );
  });

  it('should re-generate configuration of simple-android-runner fixture given same configuration', async () => {
    await new AndroidRunnerGenerator().regenerateRunnerConfig(generatorConfig);
    assert(
      sameDirContent(fixtureRunnerPath, generatedRunnerPath),
      'Generated Android Runner project differs from simple-android-runner fixture',
    );
  });
});

describe('Test AndroidRunnerGenerator for RN version 0.72.x', () => {
  const fixtureRunnerPath = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner-rn-72',
  );
  const generatedRunnerPath = tmp.dirSync({ unsafeCleanup: true }).name;
  process.chdir(generatedRunnerPath);

  const generatorConfig: RunnerGeneratorConfig = {
    extra: {
      androidConfig: {
        artifactId: 'runner-ern-container-dummy',
        groupId: 'com.walmartlabs.ern',
        packageFilePath: 'com/walmartlabs/ern/dummy',
        packageName: 'com.walmartlabs.ern.dummy',
      },
    },
    mainMiniAppName: 'dummy',
    outDir: generatedRunnerPath,
    reactNativeVersion: '0.72.0',
    targetPlatform: 'android',
  };

  it('should generate simple-android-runner fixture given same configuration', async () => {
    await new AndroidRunnerGenerator().generate(generatorConfig);
    assert(
      sameDirContent(fixtureRunnerPath, generatedRunnerPath),
      'Generated Android Runner project differs from simple-android-runner fixture',
    );
  });

  it('should re-generate configuration of simple-android-runner fixture given same configuration', async () => {
    await new AndroidRunnerGenerator().regenerateRunnerConfig(generatorConfig);
    assert(
      sameDirContent(fixtureRunnerPath, generatedRunnerPath),
      'Generated Android Runner project differs from simple-android-runner fixture',
    );
  });
});

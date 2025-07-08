import shell from 'shelljs';
import chalk from 'chalk';
import path from 'path';
import { AndroidRunnerGenerator } from 'ern-runner-gen-android';

async function regenAndroidRunnerFixture() {
  console.log('Regenerating Android Runner Fixtures...');
  const fixturesPath1 = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner-rn-67',
  );
  const fixturesPath2 = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner-rn-72',
  );
  const fixturesPath3 = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner-rn-77',
  );
  shell.rm('-rf', fixturesPath1);
  shell.mkdir('-p', fixturesPath1);
  shell.rm('-rf', fixturesPath2);
  shell.mkdir('-p', fixturesPath2);
  shell.rm('-rf', fixturesPath3);
  shell.mkdir('-p', fixturesPath3);
  await new AndroidRunnerGenerator().generate({
    mainMiniAppName: 'dummy',
    outDir: fixturesPath1,
    reactNativeVersion: '0.67.0',
    targetPlatform: 'android',
  });
  await new AndroidRunnerGenerator().generate({
    mainMiniAppName: 'dummy',
    outDir: fixturesPath2,
    reactNativeVersion: '0.72.0',
    targetPlatform: 'android',
  });
  await new AndroidRunnerGenerator().generate({
    mainMiniAppName: 'dummy',
    outDir: fixturesPath3,
    reactNativeVersion: '0.77.0',
    targetPlatform: 'android',
  });
  console.log(chalk.green('Done!'));
}

regenAndroidRunnerFixture().catch((e) => console.error(e));

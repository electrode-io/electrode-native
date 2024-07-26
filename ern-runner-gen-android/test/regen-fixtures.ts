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
  shell.rm('-rf', fixturesPath1);
  shell.mkdir('-p', fixturesPath1);
  shell.rm('-rf', fixturesPath2);
  shell.mkdir('-p', fixturesPath2);
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
  console.log(chalk.green('Done!'));
}

regenAndroidRunnerFixture().catch((e) => console.error(e));

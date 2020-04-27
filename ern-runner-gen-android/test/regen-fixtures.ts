import shell from 'shelljs';
import chalk from 'chalk';
import path from 'path';
import { AndroidRunnerGenerator } from 'ern-runner-gen-android';

async function regenAndroidRunnerFixture() {
  console.log('Regenerating Android Runner Fixture...');
  const fixturesPath = path.join(
    __dirname,
    'fixtures',
    'simple-android-runner',
  );
  shell.rm('-rf', fixturesPath);
  shell.mkdir('-p', fixturesPath);
  await new AndroidRunnerGenerator().generate({
    mainMiniAppName: 'dummy',
    outDir: fixturesPath,
    reactNativeVersion: '0.62.2',
    targetPlatform: 'android',
  });
  console.log(chalk.green('Done!'));
}

regenAndroidRunnerFixture().catch(e => console.error(e));

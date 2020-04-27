import shell from 'shelljs';
import chalk from 'chalk';
import path from 'path';
import { IosRunnerGenerator } from 'ern-runner-gen-ios';

async function regenIosRunnerFixture() {
  console.log('Regenerating iOS Runner Fixture...');
  const fixturesPath = path.join(__dirname, 'fixtures', 'simple-ios-runner');
  shell.rm('-rf', fixturesPath);
  shell.mkdir('-p', fixturesPath);
  await new IosRunnerGenerator().generate({
    extra: {
      containerGenWorkingDir: '/path/to/container',
    },
    mainMiniAppName: 'dummy',
    outDir: fixturesPath,
    reactNativeVersion: '0.62.2',
    targetPlatform: 'ios',
  });
  console.log(chalk.green('Done!'));
}

regenIosRunnerFixture().catch(e => console.error(e));

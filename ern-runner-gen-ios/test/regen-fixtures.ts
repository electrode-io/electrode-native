import shell from 'shelljs'
import chalk from 'chalk'
import path from 'path'
import { getRunnerGeneratorForPlatform } from 'ern-orchestrator'

const pathToTestFixtures = path.join(__dirname, 'fixtures')
const pathToGeneratedFixtures = path.join(
  __dirname,
  'generated/simple-ios-runner'
)
logHeader('Regenerating iOS Runner Fixture')
getRunnerGeneratorForPlatform('ios')
  .regenerateRunnerConfig({
    extra: {
      containerGenWorkingDir: '/path/to/container',
    },
    mainMiniAppName: 'dummy',
    outDir: pathToGeneratedFixtures,
    reactNativeVersion: '0.60.5',
    targetPlatform: 'ios',
  })
  .then(() => {
    shell.cp('-Rf', pathToGeneratedFixtures, pathToTestFixtures)
    console.log(chalk.green('Done!'))
  })

function logHeader(message: string) {
  console.log('======================================================')
  console.log(message)
  console.log('======================================================')
}

import shell from 'shelljs'
import chalk from 'chalk'
import path from 'path'
import { getRunnerGeneratorForPlatform } from 'ern-orchestrator'

const pathToTestFixtures = path.join(__dirname, 'fixtures')
const pathToGeneratedFixtures = path.join(
  __dirname,
  'generated/simple-android-runner'
)
logHeader('Regenerating Android Runner Fixture')
getRunnerGeneratorForPlatform('android')
  .regenerateRunnerConfig({
    mainMiniAppName: 'dummy',
    outDir: pathToGeneratedFixtures,
    reactNativeVersion: '0.60.5',
    targetPlatform: 'android',
  })
  .then(() => {
    shell.cp('-Rf', pathToGeneratedFixtures, pathToTestFixtures)
    console.log(chalk.green('Done!'))
  })

function logHeader(message) {
  console.log('======================================================')
  console.log(message)
  console.log('======================================================')
}

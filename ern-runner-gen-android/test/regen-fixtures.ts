import shell from 'shelljs'
import chalk from 'chalk'
import path from 'path'
import generateFixtures from '../src/utils/generatorHelper'

const pathToFixtures = path.join(__dirname, 'fixtures')
const pathToGenerated = path.join(
  __dirname,
  'generated',
  'simple-android-runner'
)
logHeader('Regenerating Android Runner Fixture')
generateFixtures('dummy', pathToGenerated, 'android').then(() => {
  shell.cp('-Rf', pathToGenerated, pathToFixtures)
  console.log(chalk.green('Done!'))
})

function logHeader(message) {
  console.log('======================================================')
  console.log(message)
  console.log('======================================================')
}

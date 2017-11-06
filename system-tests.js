const shell = require('shelljs')
const chalk = require('chalk')
const tmp = require('tmp')
const path = require('path')
const workingDirectoryPath = tmp.dirSync({ unsafeCleanup: true }).name
const info = chalk.bold.blue

const gitUserName = 'ernplatformtest'
const gitPassword = 'ernplatformtest12345'
const gitHubCauldronRepositoryName = `cauldron-system-tests-${getRandomInt(0, 1000)}`
const cauldronName = 'cauldron-automation'
const miniAppName = 'MiniAppSystemTest'
const miniAppPackageName = 'miniapp-system-test'
const apiName = 'TestApi'
const apiPkgName = 'test'
const invalidElectrodeNativeModuleName = 'Test-Api' // alpha only is valid
const nativeApplicationName = 'system-test-app'
const nativeApplicationVersion = '1.0.0'
const androidNativeApplicationDescriptor = `${nativeApplicationName}:android:${nativeApplicationVersion}`
const iosNativeApplicationDescriptor = `${nativeApplicationName}:ios:${nativeApplicationVersion}`
const movieListMiniAppVersion = '0.0.7'
const movieDetailsMiniAppVersion = '0.0.6'
const movieApi = 'react-native-ernmovie-api'
const movieApiImpl = 'ErnMovieApiImpl'
const packageNotInNpm = 'ewkljrlwjerjlwjrl@0.0.3'

process.env['SYSTEM_TESTS'] = 'true'

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

function run (command, {
  expectedExitCode = 0
} = {}) {
  console.log('===========================================================================')
  console.log(`${chalk.bold.red('Running')} ${chalk.bold.blue(`${command}`)}`)
  const exitCode = shell.exec(command).code
  if (exitCode !== expectedExitCode) {
    console.log(`${chalk.bold.red('!!! TEST FAILED !!! ')} ${chalk.bold.blue(`${command}`)}`)
    console.log(`Expected exit code ${expectedExitCode} but command exited with code ${exitCode}`)
    afterAll()
    shell.exit(1)
  }
  console.log('===========================================================================')
}

function afterAll () {
  console.log('===========================================================================')
  console.log(info('Cleaning up test env'))
  console.log(info(`Removing GitHub repository (${gitHubCauldronRepositoryName})`))
  shell.exec(`curl -u ${gitUserName}:${gitPassword} -X DELETE https://api.github.com/repos/${gitUserName}/${gitHubCauldronRepositoryName}`)
  console.log(info('Deactivating current Cauldron'))
  shell.exec('ern cauldron repo clear')
  console.log(info('Removing Cauldron alias'))
  shell.exec(`ern cauldron repo remove ${cauldronName}`)
  console.log('===========================================================================')
}

console.log(info(`Entering temporary working directory : ${workingDirectoryPath}`))
process.chdir(workingDirectoryPath)

console.log(info(`Creating GitHub repository (${gitHubCauldronRepositoryName})`))
run(`curl -u ${gitUserName}:${gitPassword} -d '{"name": "${gitHubCauldronRepositoryName}"}' https://api.github.com/user/repos`)

run('ern --hide-banner')
run('ern --log-level trace')

// Cauldron repo
run('ern cauldron repo clear')
run(`ern cauldron repo add ${cauldronName} https://${gitUserName}:${gitPassword}@github.com/${gitUserName}/${gitHubCauldronRepositoryName}.git --current=false`)
run(`ern cauldron repo use ${cauldronName}`)
run('ern cauldron repo current')
run('ern cauldron repo list')

// Miniapp commands
run(`ern create-miniapp ${miniAppName} --packageName ${miniAppPackageName} --skipNpmCheck`)
const miniAppPath = path.join(process.cwd(), miniAppName)
console.log(info(`Entering ${miniAppPath}`))
process.chdir(miniAppPath)
run('ern add react-native-electrode-bridge')

// Cauldron access commands
run(`ern cauldron add nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps movielistminiapp@${movieListMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps movielistminiapp@${movieListMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps moviedetailsminiapp@${movieDetailsMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps moviedetailsminiapp@${movieDetailsMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)

// Already existing miniapp
run(`ern cauldron add miniapps moviedetailsminiapp@${movieDetailsMiniAppVersion} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })
// Non published miniapp
run(`ern cauldron add miniapps ${packageNotInNpm} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })
// File system miniapp
run(`ern cauldron add miniapps file:${miniAppPath} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })

// Container gen should be successful for the two following commands
run(`ern create-container --miniapps file:${miniAppPath} -p android -v 1.0.0`)
run(`ern create-container --miniapps file:${miniAppPath} -p ios -v 1.0.0`)

run(`ern create-container --miniapps file:${miniAppPath} movielistminiapp@${movieListMiniAppVersion} -p android -v 1.0.0`)
run(`ern create-container --miniapps file:${miniAppPath} movielistminiapp@${movieListMiniAppVersion} -p ios -v 1.0.0`)

run(`ern create-container --descriptor ${androidNativeApplicationDescriptor}`)
run(`ern create-container --descriptor ${iosNativeApplicationDescriptor}`)

run(`ern why react-native-ernmovie-api ${androidNativeApplicationDescriptor}`)

// Del dependency should fail because its still used by MovieListMiniApp
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })

// Del miniapp
run(`ern cauldron del miniapps movielistminiapp -d ${androidNativeApplicationDescriptor}`)

// Del dependency should now succeed
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)

process.chdir(workingDirectoryPath)

// api
run(`ern create-api ${invalidElectrodeNativeModuleName} --skipNpmCheck`, { expectedExitCode: 1 })
run(`ern create-api ${apiName} -p ${apiPkgName} --skipNpmCheck`)
const apiPath = path.join(process.cwd(), apiName)
console.log(info(`Entering ${apiPath}`))
process.chdir(apiPath)
run('ern regen-api --skipVersion')

// api-impl
run(`ern create-api-impl ${packageNotInNpm} --skipNpmCheck --nativeOnly --force`, { expectedExitCode: 1 })
run(`ern create-api-impl ${packageNotInNpm} ${invalidElectrodeNativeModuleName} --skipNpmCheck --nativeOnly --force`, { expectedExitCode: 1 })

run(`ern create-api-impl ${movieApi} ${movieApiImpl} --skipNpmCheck --nativeOnly --force`)
const apiImplPath = path.join(process.cwd(), `${movieApiImpl}`)
console.log(info(`Entering ${apiImplPath}`))
process.chdir(apiImplPath)
run('ern regen-api-impl')

// Platform commands
run('ern platform current')
run('ern platform list')
run('ern platform plugins list')
run('ern platform plugins search react-native')

afterAll()

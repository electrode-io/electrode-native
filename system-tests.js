const shell = require('shelljs')
const chalk = require('chalk')
const tmp = require('tmp')
const path = require('path')
const fs = require('fs')
require('colors')
const dircompare = require('dir-compare')
const jsdiff = require('diff')
const workingDirectoryPath = tmp.dirSync({ unsafeCleanup: true }).name
const info = chalk.bold.blue

const gitUserName = 'ernplatformtest'
const gitPassword = 'ernplatformtest12345'
const gitHubCauldronRepositoryName = `cauldron-system-tests-${getRandomInt(0, 1000)}`
const cauldronName = 'cauldron-automation'
const miniAppName = 'MiniAppSystemTest'
const miniAppPackageName = 'miniapp-system-test'
const apiName = 'TestApi'
const complexApi = 'ComplexApi'
const apiPkgName = 'test'
const invalidElectrodeNativeModuleName = 'Test-Api' // alpha only is valid
const nativeApplicationName = 'system-test-app'
const nativeApplicationVersion = '1.0.0'
const nativeApplicationVersionNew = '2.0.0'
const androidNativeApplicationDescriptor = `${nativeApplicationName}:android:${nativeApplicationVersion}`
const iosNativeApplicationDescriptor = `${nativeApplicationName}:ios:${nativeApplicationVersion}`
const iosNativeApplicationDescriptorNewVersion = `${nativeApplicationName}:ios:${nativeApplicationVersionNew}`
const movieListMiniAppPackageName = 'movielistminiapp'
const movieListMiniAppVersion = '0.0.11'
const movieDetailsMiniAppPackageName = 'moviedetailsminiapp'
const movieDetailsMiniAppVersion = '0.0.10'
const movieApi = 'react-native-ernmovie-api'
const movieApiImpl = 'ErnMovieApiImplNative'
const movieApiImplPkgName = 'ern-movie-api-impl'
const packageNotInNpm = 'ewkljrlwjerjlwjrl@0.0.3'
const processCwd = process.cwd()
const pathToSystemTestsFixtures = path.join(processCwd, 'system-tests-fixtures')
const pathToAndroidContainerFixture = path.join(pathToSystemTestsFixtures, 'android-container')
const pathToIosContainerFixture = path.join(pathToSystemTestsFixtures, 'ios-container')
const pathToDefaultAPI = path.join(pathToSystemTestsFixtures, 'api')
const pathToComplexAPI = path.join(pathToSystemTestsFixtures, 'api')
const pathToComplexSchema = path.join(pathToComplexAPI, 'ComplexApi', 'schema.json')
const pathToApiImplNative = path.join(pathToSystemTestsFixtures, 'api-impl-native')
const pathToApiImplJS = path.join(pathToSystemTestsFixtures, 'api-impl-js')
const filesToIgnore = [
  'ElectrodeApiImpl.xcodeproj',
  'project.pbxproj',
  'package.json',
  '.DS_Store',
  'index.android.bundle',
  'index.android.bundle.meta',
  'yarn.lock',
  'README.md',
  'WalmartItemApi.spec.js',
  'SysteTestEventApi.spec.js',
  'SystemTestsApi.spec.js'
]
const reactNativeMovieApiImplJsPackageName = 'react-native-ernmovie-api-impl-js'
const reactNativeMovieApiImplJsVersion = '0.0.2'

process.env['SYSTEM_TESTS'] = 'true'
process.on('SIGINT', () => afterAll())

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
  const cmdProcess = shell.exec(command)
  if (!cmdProcess) {
    // Process was killed, perform clean up
    afterAll()
    shell.exit(1)
  } else if (cmdProcess.code !== expectedExitCode) {
    console.log(`${chalk.bold.red('!!! TEST FAILED !!! ')} ${chalk.bold.blue(`${command}`)}`)
    console.log(`Expected exit code ${expectedExitCode} but command exited with code ${cmdProcess.code}`)
    afterAll()
    shell.exit(1)
  }
  console.log('===========================================================================')
}

function assert (expression, message) {
  if (!expression) {
    console.log(`${chalk.bold.red(`Assertion failed: ${message}`)}`)
    afterAll()
    shell.exit(1)
  }
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

// Given two paths to Android generated containers, return true if the containers
// contains the exact same structure and files (including file content) or false otherwise
// Considering that `index.android.bundle` and `index.android.bundle.meta` can vary legitimately
// from generation to generation, we allow difference of content for these files
function areSameAndroidContainers (pathA, pathB) {
  return areSameDirectoriesContent(pathA, pathB, ['index.android.bundle', 'index.android.bundle.meta'])
}

// Given two paths to iOS generated containers, return true if the containers contains the
// exact same structure and files (including file content) or false otherwise
// Considering that `MiniApp.jsbundle` and `MiniApp.js.bundle.meta` can vary legitimately
// from generation to generation, we allow difference of content for these files
// Also due to the high number of differences in pbxproj (randomy generated IDs) we just
// ignore differences in this file (furether improvement to system tests should only ignore
// content that should be ignored in this file)
function areSameIosContainers (pathA, pathB) {
  return areSameDirectoriesContent(pathA, pathB, ['project.pbxproj', 'MiniApp.jsbundle', 'MiniApp.jsbundle.meta'])
}

function areSameDirectoriesContent (pathA, pathB, filesToIgnoreContentDiff = []) {
  let result = true
  const directoriesDiff = dircompare.compareSync(pathA, pathB, {compareContent: true})
  for (const diff of directoriesDiff.diffSet) {
    if (diff.state === 'distinct') {
      if (!filesToIgnoreContentDiff.includes(diff.name1)) {
        console.log('A difference in content was found !')
        console.log(JSON.stringify(diff))
        let diffLine = jsdiff.diffLines(
          fs.readFileSync(path.join(diff.path1, diff.name1)).toString(),
          fs.readFileSync(path.join(diff.path2, diff.name2)).toString())
        diffLine.forEach((part) => {
          let color = part.added ? 'green'
            : part.removed ? 'red' : 'grey'
          process.stderr.write(part.value[color])
        })
        result = false
      }
    }
  }
  return result
}

console.log(info(`Entering temporary working directory : ${workingDirectoryPath}`))
process.chdir(workingDirectoryPath)

console.log(info(`Creating GitHub repository (${gitHubCauldronRepositoryName})`))
run(`curl -u ${gitUserName}:${gitPassword} -d '{"name": "${gitHubCauldronRepositoryName}"}' https://api.github.com/user/repos`)

run('ern platform config showBanner false')
run('ern platform config logLevel trace')
run('ern --version')

// Cauldron repo
run('ern cauldron repo clear')
run(`ern cauldron repo add ${cauldronName} https://${gitUserName}:${gitPassword}@github.com/${gitUserName}/${gitHubCauldronRepositoryName}.git --current=false`)
run(`ern cauldron repo use ${cauldronName}`)
run('ern cauldron repo current')
run('ern cauldron repo list')

run('ern compat-check', { expectedExitCode: 1 })

// Miniapp commands
run(`ern create-miniapp ${miniAppName} --packageName ${miniAppPackageName} --skipNpmCheck`)
const miniAppPath = path.join(process.cwd(), miniAppName)
console.log(info(`Entering ${miniAppPath}`))
process.chdir(miniAppPath)
run('ern add react-native-electrode-bridge')

// list dependencies command
run('ern list dependencies')
run(`ern list dependencies ${movieListMiniAppPackageName}@${movieListMiniAppVersion}`)

// Cauldron access commands
run(`ern cauldron add nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${movieListMiniAppPackageName}@${movieListMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${movieListMiniAppPackageName}@${movieListMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${movieDetailsMiniAppPackageName}@${movieDetailsMiniAppVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${movieDetailsMiniAppPackageName}@${movieDetailsMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptorNewVersion} -c 1000.1000.1`, { expectedExitCode: 1 })
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptorNewVersion} -c latest`)
run(`ern cauldron add dependencies react-native-code-push@5.2.1 -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add dependencies react-native-code-push@5.2.1 -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get dependency ${iosNativeApplicationDescriptorNewVersion}`)
run(`ern cauldron add jsapiimpls ${reactNativeMovieApiImplJsPackageName}@${reactNativeMovieApiImplJsVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add jsapiimpls ${reactNativeMovieApiImplJsPackageName}@${reactNativeMovieApiImplJsVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp`)

run(`ern cauldron get config ${iosNativeApplicationDescriptorNewVersion}`)

// Already existing miniapp
run(`ern cauldron add miniapps ${movieDetailsMiniAppPackageName}@${movieDetailsMiniAppVersion} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })
// Non published miniapp
run(`ern cauldron add miniapps ${packageNotInNpm} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })

// Container gen should be successful for the two following commands
run(`ern create-container --miniapps file:${miniAppPath} -p android`)
run(`ern create-container --miniapps file:${miniAppPath} -p ios`)

run(`ern create-container --miniapps file:${miniAppPath} ${movieListMiniAppPackageName}@${movieListMiniAppVersion} -p android`)
run(`ern create-container --miniapps file:${miniAppPath} ${movieListMiniAppPackageName}@${movieListMiniAppVersion} -p ios`)

const androidContainerOutDir = tmp.dirSync({ unsafeCleanup: true }).name
run(`ern create-container --descriptor ${androidNativeApplicationDescriptor} --out ${androidContainerOutDir}`)
assert(areSameAndroidContainers(pathToAndroidContainerFixture, androidContainerOutDir), 'Generated Android Container differ from reference fixture !')

const iosContainerOutDir = tmp.dirSync({ unsafeCleanup: true }).name
run(`ern create-container --descriptor ${iosNativeApplicationDescriptor} --out ${iosContainerOutDir}`)
assert(areSameIosContainers(pathToIosContainerFixture, iosContainerOutDir), 'Generated iOS Container differ from reference fixture !')

run(`ern why react-native-ernmovie-api ${androidNativeApplicationDescriptor}`)

// Del dependency should fail because its still used by MovieListMiniApp
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })

// Del miniapp
run(`ern cauldron del miniapps ${movieListMiniAppPackageName} -d ${androidNativeApplicationDescriptor}`)

// Del dependency should now succeed
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)

// Del jsapiimpls
run(`ern cauldron del jsapiimpls ${reactNativeMovieApiImplJsPackageName}@${reactNativeMovieApiImplJsVersion} -d ${androidNativeApplicationDescriptor}`)

// Del nativeapp
run(`ern cauldron del nativeapp ${androidNativeApplicationDescriptor}`)

run(`ern compat-check -m ${movieListMiniAppPackageName}@${movieListMiniAppVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern upgrade-miniapp`)

process.chdir(workingDirectoryPath)

// api
run(`ern create-api ${invalidElectrodeNativeModuleName} --skipNpmCheck`, { expectedExitCode: 1 })

// api-impl
run(`ern create-api-impl ${packageNotInNpm} --skipNpmCheck --nativeOnly --force`, { expectedExitCode: 1 })
run(`ern create-api-impl ${movieApi} ${invalidElectrodeNativeModuleName} --skipNpmCheck --nativeOnly --force`, { expectedExitCode: 1 })
run(`ern create-api-impl ${movieApi} ${movieApiImpl} -p ${movieApiImplPkgName} --skipNpmCheck --nativeOnly --force`)
const apiImplPath = path.join(process.cwd(), movieApiImpl)
console.log(info(`Entering ${apiImplPath}`))
process.chdir(apiImplPath)
run('ern regen-api-impl')

// Platform commands
run('ern platform current')
run('ern platform list')
run('ern platform plugins list')
run('ern platform plugins search react-native')

process.chdir(workingDirectoryPath)
run(`ern create-api ${apiName} -p ${apiPkgName} --skipNpmCheck`)
assert(areSameDirectoriesContent(pathToDefaultAPI, workingDirectoryPath, filesToIgnore), 'Generated API differ from reference fixture !')
const apiPath = path.join(process.cwd(), apiName)
console.log(info(`Entering ${apiPath}`))
process.chdir(apiPath)
run('ern regen-api --skipVersion')

process.chdir(workingDirectoryPath)
run(`ern create-api ${complexApi} -p ${apiPkgName}  --schemaPath ${pathToComplexSchema} --skipNpmCheck`)
assert(areSameDirectoriesContent(pathToComplexAPI, workingDirectoryPath, filesToIgnore), 'Generated API differ from reference fixture !')

//  Tests for API IMPL Native
process.chdir(workingDirectoryPath)
run(`ern create-api-impl ${movieApi} -p ${movieApiImplPkgName} --skipNpmCheck --nativeOnly --outputDirectory ${workingDirectoryPath} --force`)
assert(areSameDirectoriesContent(pathToApiImplNative, workingDirectoryPath, filesToIgnore), 'Generated API Native Impl differ from reference fixture !')

//  Tests for API IMPL JS
process.chdir(workingDirectoryPath)
run(`ern create-api-impl ${movieApi} -p ${movieApiImplPkgName} --skipNpmCheck --jsOnly --outputDirectory ${workingDirectoryPath} --force`)
assert(areSameDirectoriesContent(pathToApiImplJS, workingDirectoryPath, filesToIgnore), 'Generated API JS Impl differ from reference fixture !')

afterAll()

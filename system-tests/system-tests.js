const chalk = require('chalk')
const tmp = require('tmp')
const path = require('path')
const afterAll = require('./utils/afterAll')
const assert = require('./utils/assert')
const randomInt = require('./utils/randomInt')
const sameDirContent = require('./utils/sameDirContent')
const run = require('./utils/run')
const f = require('./fixtures/constants')

const processCwd = process.cwd()
const workingDirectoryPath = tmp.dirSync({ unsafeCleanup: true }).name
const info = chalk.bold.blue
const androidNativeApplicationDescriptor = `${f.systemTestNativeApplicationName}:android:${f.systemTestNativeApplicationVersion1}`
const iosNativeApplicationDescriptor = `${f.systemTestNativeApplicationName}:ios:${f.systemTestNativeApplicationVersion1}`
const iosNativeApplicationDescriptorNewVersion = `${f.systemTestNativeApplicationName}:ios:${f.systemTestNativeApplicationVersion2}`
const pathToSystemTestsFixtures = path.join(processCwd, 'system-tests', 'fixtures')
const pathToAndroidContainerFixture = path.join(pathToSystemTestsFixtures, 'android-container')
const pathToIosContainerFixture = path.join(pathToSystemTestsFixtures, 'ios-container')
const pathToApiFixtureDir = path.join(pathToSystemTestsFixtures, 'api')
const pathToComplexSchema = path.join(pathToApiFixtureDir, f.complexApiName, 'schema.json')
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

process.env['SYSTEM_TESTS'] = 'true'
process.on('SIGINT', () => afterAll())

console.log(info(`Entering temporary working directory : ${workingDirectoryPath}`))
process.chdir(workingDirectoryPath)

console.log(info(`Creating GitHub repository (${f.gitHubCauldronRepositoryName})`))
run(`curl -u ${f.gitUserName}:${f.gitPassword} -d '{"name": "${f.gitHubCauldronRepositoryName}"}' https://api.github.com/user/repos`)

run('ern platform config showBanner false')
run('ern platform config logLevel trace')
run('ern --version')

// Cauldron repo
run('ern cauldron repo clear')
run(`ern cauldron repo add ${f.cauldronName} https://${f.gitUserName}:${f.gitPassword}@github.com/${f.gitUserName}/${f.gitHubCauldronRepositoryName}.git --current=false`)
run(`ern cauldron repo use ${f.cauldronName}`)
run('ern cauldron repo current')
run('ern cauldron repo list')

run('ern compat-check', { expectedExitCode: 1 })

// Miniapp commands
run(`ern create-miniapp ${f.systemTestMiniAppName} --packageName ${f.systemTestMiniAppPkgName} --skipNpmCheck`)
const miniAppPath = path.join(process.cwd(), f.systemTestMiniAppName)
console.log(info(`Entering ${miniAppPath}`))
process.chdir(miniAppPath)
run('ern add react-native-electrode-bridge')

// list dependencies command
run('ern list dependencies')
run(`ern list dependencies ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`)

// Cauldron access commands
run(`ern cauldron add nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add miniapps ${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${iosNativeApplicationDescriptor}`)
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptorNewVersion} -c 1000.1000.1`, { expectedExitCode: 1 })
run(`ern cauldron add nativeapp ${iosNativeApplicationDescriptorNewVersion} -c latest`)
run(`ern cauldron add dependencies react-native-code-push@5.2.1 -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add dependencies react-native-code-push@5.2.1 -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get dependency ${iosNativeApplicationDescriptorNewVersion}`)
run(`ern cauldron add jsapiimpls ${f.movieApiImplJsPkgName}@${f.movieApiImplJsPkgVersion} -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron add jsapiimpls ${f.movieApiImplJsPkgName}@${f.movieApiImplJsPkgVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp`)

run(`ern cauldron get config ${iosNativeApplicationDescriptorNewVersion}`)

// Already existing miniapp
run(`ern cauldron add miniapps ${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })
// Non published miniapp
run(`ern cauldron add miniapps ${f.notInNpmPkg} -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })

// Container gen should be successful for the two following commands
run(`ern create-container --miniapps file:${miniAppPath} -p android`)
run(`ern create-container --miniapps file:${miniAppPath} -p ios`)

run(`ern create-container --miniapps file:${miniAppPath} ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -p android`)
run(`ern create-container --miniapps file:${miniAppPath} ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -p ios`)

const androidContainerOutDir = tmp.dirSync({ unsafeCleanup: true }).name
run(`ern create-container --descriptor ${androidNativeApplicationDescriptor} --out ${androidContainerOutDir}`)
assert(sameDirContent(pathToAndroidContainerFixture, androidContainerOutDir, ['index.android.bundle', 'index.android.bundle.meta']), 'Generated Android Container differ from reference fixture !')


const iosContainerOutDir = tmp.dirSync({ unsafeCleanup: true }).name
run(`ern create-container --descriptor ${iosNativeApplicationDescriptor} --out ${iosContainerOutDir}`)
assert(sameDirContent(pathToIosContainerFixture, iosContainerOutDir, ['project.pbxproj', 'MiniApp.jsbundle', 'MiniApp.jsbundle.meta']), 'Generated iOS Container differ from reference fixture !')

run(`ern why react-native-ernmovie-api ${androidNativeApplicationDescriptor}`)

// Del dependency should fail because its still used by MovieListMiniApp
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`, { expectedExitCode: 1 })

// Del miniapp
run(`ern cauldron del miniapps ${f.movieListMiniAppPgkName} -d ${androidNativeApplicationDescriptor}`)

// Del dependency should now succeed
run(`ern cauldron del dependencies react-native-ernmovie-api -d ${androidNativeApplicationDescriptor}`)
run(`ern cauldron get nativeapp ${androidNativeApplicationDescriptor}`)

// Del jsapiimpls
run(`ern cauldron del jsapiimpls ${f.movieApiImplJsPkgName}@${reactNativeMovieApiImplJsVersion} -d ${androidNativeApplicationDescriptor}`)

// Del nativeapp
run(`ern cauldron del nativeapp ${androidNativeApplicationDescriptor}`)

run(`ern compat-check -m ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -d ${iosNativeApplicationDescriptor}`)
run(`ern upgrade-miniapp`)

process.chdir(workingDirectoryPath)

// api
run(`ern create-api ${f.invalidElectrodeNativeModuleName} --skipNpmCheck`, { expectedExitCode: 1 })

// api-impl
run(`ern create-api-impl ${f.notInNpmPkg} --skipNpmCheck --nativeOnly --force`, { expectedExitCode: 1 })
run(`ern create-api-impl ${f.movieApiPkgName} ${f.invalidElectrodeNativeModuleName} --skipNpmCheck --nativeOnly --force`, { expectedExitCode: 1 })
run(`ern create-api-impl ${f.movieApiPkgName} ${f.movieApiImplName} -p ${f.movieApiImplPkgName} --skipNpmCheck --nativeOnly --force`)
const apiImplPath = path.join(process.cwd(), f.movieApiImplName)
console.log(info(`Entering ${apiImplPath}`))
process.chdir(apiImplPath)
run('ern regen-api-impl')

// Platform commands
run('ern platform current')
run('ern platform list')
run('ern platform plugins list')
run('ern platform plugins search react-native')

process.chdir(workingDirectoryPath)
run(`ern create-api ${f.testApiName} -p ${f.testApiPkgName} --skipNpmCheck`)
assert(sameDirContent(pathToApiFixtureDir, workingDirectoryPath, filesToIgnore), 'Generated API differ from reference fixture !')
const apiPath = path.join(process.cwd(), f.testApiName)
console.log(info(`Entering ${apiPath}`))
process.chdir(apiPath)
run('ern regen-api --skipVersion')

process.chdir(workingDirectoryPath)
run(`ern create-api ${f.complexApiName} -p ${f.testApiPkgName}  --schemaPath ${pathToComplexSchema} --skipNpmCheck`)
assert(sameDirContent(pathToApiFixtureDir, workingDirectoryPath, filesToIgnore), 'Generated API differ from reference fixture !')

//  Tests for API IMPL Native
process.chdir(workingDirectoryPath)
run(`ern create-api-impl ${f.movieApiPkgName} -p ${f.movieApiImplPkgName} --skipNpmCheck --nativeOnly --outputDirectory ${workingDirectoryPath} --force`)
assert(sameDirContent(pathToApiImplNative, workingDirectoryPath, filesToIgnore), 'Generated API Native Impl differ from reference fixture !')

//  Tests for API IMPL JS
process.chdir(workingDirectoryPath)
run(`ern create-api-impl ${f.movieApiPkgName} -p ${f.movieApiImplPkgName} --skipNpmCheck --jsOnly --outputDirectory ${workingDirectoryPath} --force`)
assert(sameDirContent(pathToApiImplJS, workingDirectoryPath, filesToIgnore), 'Generated API JS Impl differ from reference fixture !')

afterAll()

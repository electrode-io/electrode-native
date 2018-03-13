const inquirer = require('inquirer')
const shell = require('shelljs')
const path = require('path')
const f = require('./fixtures/constants')

const regenFunctionByFixtureName = {
  "android-container": regenAndroidContainerFixture,
  "ios-container": regenIosContainerFixture,
  "api-impl-js": regenApiImplJsFixture,
  "api-impl-native": regenApiImplNativeFixture,
  "ComplexApi": regenComplexApiFixture,
  "TestApi": regenTestApiFixture
}

const rootFixturesPath = path.join(__dirname, 'fixtures')
const rootApiFixturesPath = path.join(rootFixturesPath, 'api')
const pathsToFixtures = {
  "android-container": path.join(rootFixturesPath, 'android-container'),
  "ios-container": path.join(rootFixturesPath, 'ios-container'),
  "api-impl-js": path.join(rootFixturesPath, 'api-impl-js'),
  "api-impl-native": path.join(rootFixturesPath, 'api-impl-native'),
  "ComplexApi": path.join(rootApiFixturesPath, 'ComplexApi'),
  "TestApi": path.join(rootApiFixturesPath, 'TestApi')
}

inquirer.prompt([{
  type: 'checkbox',
  name: 'userSelectedFixturesToRegen',
  message: 'Choose one or more system test fixture(s) to regenerate',
  choices: Object.keys(regenFunctionByFixtureName)
}]).then(answers => {
  shell.exec(`ern platform config logLevel trace`)
  shell.exec(`ern cauldron repo clear`)
  for (const userSelectedFixtureToRegen of answers.userSelectedFixturesToRegen) {
    regenFunctionByFixtureName[userSelectedFixtureToRegen]()
  }
})

const containerMiniapps = [
  `${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`,
  `${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion}`
]

function regenAndroidContainerFixture() {
  logHeader("Regenerating Android Container Fixture")
  shell.rm('-rf', pathsToFixtures['android-container'])
  shell.exec(`ern create-container --miniapps ${containerMiniapps.join(' ')} -p android --dependencies react-native-code-push@5.2.1 --out ${pathsToFixtures['android-container']}`)
}

function regenIosContainerFixture() {
  logHeader("Regenerating iOS Container Fixture")
  shell.rm('-rf', pathsToFixtures['ios-container'])
  shell.exec(`ern create-container --miniapps ${containerMiniapps.join(' ')} -p ios --dependencies react-native-code-push@5.2.1 --out ${pathsToFixtures['ios-container']}`)
}

function regenApiImplJsFixture() {
  logHeader("Regenerating JS API Implementation Fixture")
  shell.rm('-rf', pathsToFixtures['api-impl-js'])
  shell.exec(`ern create-api-impl ${f.movieApiPkgName} -p ${f.movieApiImplPkgName} --skipNpmCheck --jsOnly --outputDirectory ${pathsToFixtures['api-impl-js']} --force`)
}

function regenApiImplNativeFixture() {
  logHeader("Regenerating Native API Implementation Fixture")
  shell.rm('-rf', pathsToFixtures['api-impl-native'])
  shell.exec(`ern create-api-impl ${f.movieApiPkgName} -p ${f.movieApiImplPkgName} --skipNpmCheck --nativeOnly --outputDirectory ${pathsToFixtures['api-impl-native']} --force`)
}

function regenComplexApiFixture() {
  logHeader("Regenerating Complex API Fixture")
  shell.rm('-rf', pathsToFixtures['ComplexApi'])
  shell.cd(rootApiFixturesPath)
  shell.exec(`ern create-api ${f.complexApiName} -p ${f.testApiPkgName}  --schemaPath ${f.pathToComplexApiSchema} --skipNpmCheck`)
}

function regenTestApiFixture() {
  logHeader("Regenerating Test API Fixture")
  shell.rm('-rf', pathsToFixtures['TestApi'])
  shell.cd(rootApiFixturesPath)
  shell.exec(`ern create-api ${f.testApiName} -p ${f.testApiPkgName} --skipNpmCheck`)
}

function logHeader(message) {
  console.log("======================================================")
  console.log(message)
  console.log("======================================================")
}
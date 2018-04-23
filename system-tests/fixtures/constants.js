const path = require('path')
const randomInt = require('../utils/randomInt')

const baseConstants = {
  notInNpmPkg: 'ewkljrlwjerjlwjrl@0.0.3',
  movieApiPkgName: 'react-native-ernmovie-api',
  movieApiImplName: 'ErnMovieApiImplNative',
  movieApiImplPkgName: 'ern-movie-api-impl',
  gitUserName: 'ernplatformtest',
  gitPassword: 'ernplatformtest12345',
  cauldronName: 'cauldron-system-tests',
  systemTestMiniAppName: 'MiniAppSystemTest',
  systemTestMiniAppPkgName: 'miniapp-system-test',
  testApiName: 'TestApi',
  testApiPkgName: 'test',
  complexApiName: 'ComplexApi',
  invalidElectrodeNativeModuleName: 'Test-Api',
  systemTestNativeApplicationName: 'system-test-app',
  systemTestNativeApplicationVersion1: '1.0.0',
  systemTestNativeApplicationVersion2: '2.0.0',
  movieListMiniAppPgkName: 'movielistminiapp',
  movieListMiniAppPkgVersion: '0.0.19',
  movieDetailsMiniAppPkgName: 'moviedetailsminiapp',
  movieDetailsMiniAppPkgVersion: '0.0.19',
  movieApiImplJsPkgName: 'react-native-ernmovie-api-impl-js',
  movieApiImplJsPkgVersion: '0.0.2'
}

const compositeConstants = {
  gitHubCauldronRepositoryName: `${baseConstants.cauldronName}-${randomInt(0, 1000)}`
}

const pathConstants = {
  pathToJsApiImplFixture: path.join(__dirname, 'api-impl-js'),
  pathToNativeApiImplFixture: path.join(__dirname, 'api-impl-native'),
  pathToAndroidContainerFixture: path.join(__dirname, 'android-container'),
  pathToIosContainerFixture: path.join(__dirname, 'ios-container'),
  pathToBaseApiFixture: path.join(__dirname, 'api', baseConstants.testApiName),
  pathToComplexApiFixture: path.join(__dirname, 'api', baseConstants.complexApiName),
  pathToComplexApiSchema: path.join(__dirname, 'api', 'schema.json')
}

module.exports = Object.freeze(Object.assign({}, baseConstants, compositeConstants, pathConstants))
const path = require('path')
const randomInt = require('../utils/randomInt')

const baseConstants = {
  notInNpmPkg: 'ewkljrlwjerjlwjrl@0.0.3',
  movieApiPkgName: 'react-native-ernmovie-api',
  movieApiImplName: 'ErnMovieApiImplNative',
  movieApiImplPkgName: 'ern-movie-api-impl',
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
  movieListMiniAppPkgVersion: '0.0.33',
  movieDetailsMiniAppPkgName: 'moviedetailsminiapp',
  movieDetailsMiniAppPkgVersion: '0.0.29',
  movieApiImplJsPkgName: 'react-native-ernmovie-api-impl-js',
  movieApiImplJsPkgVersion: '0.0.2',
  movieApiImplNativePkgName: 'react-native-ernmovie-api-impl',
  movieApiImplNativePkgVersion: '0.0.16'
}

const pathConstants = {
  pathToJsApiImplFixture: path.join(__dirname, 'api-impl-js'),
  pathToNativeApiImplFixture: path.join(__dirname, 'api-impl-native'),
  pathToAndroidContainerFixture: path.join(__dirname, 'android-container'),
  pathToIosContainerFixture: path.join(__dirname, 'ios-container'),
  pathToBaseApiFixture: path.join(__dirname, 'api', baseConstants.testApiName),
  pathToComplexApiFixture: path.join(__dirname, 'api', baseConstants.complexApiName),
  pathToComplexApiSchema: path.join(__dirname, 'api', 'complexapi-schema.json'),
  pathToTestApiSchema: path.join(__dirname, 'api', 'testapi-schema.json')
}

module.exports = Object.freeze(Object.assign({}, baseConstants, pathConstants))

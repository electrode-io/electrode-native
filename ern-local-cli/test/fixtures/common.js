export const validContainerVersions = [ 
  '1.2.3', 
  '0.0.0', 
  '123.456.789'
]

export const invalidContainerVersions = [ 
  '123',
  '1.2',
  '1.2.x',
  'x.y.z',
]

export const withoutGitOrFileSystemPath = [
  'package@1.2.3',
  '@scope/package@1.2.3'
]

export const withGitOrFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git#master',
  'file:/Users/username'
]

export const withoutFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git#master',
  'package@1.2.3'
]

export const withFileSystemPath = [
  'file:/Users/username'
]

export const completeNapDescriptors = [
  'myapp:android:17.14.0',
  'myapp:ios:1'
]

export const incompleteNapDescriptors = [
  'myapp',
  'myapp:android'
]

export const validNpmPackageNames = [
  'hello-world',
  '@hello/world'
]

export const invalidNpmPackageNames = [
  ' leading - space:and:weirdchars',
  'camelCase',
  'pascalCase',
  'some spaces',
  '.start-with-.',
  '_start-with-_',
  'invalid-char-~',
  'invalid-char-)',
  'invalid-char-(',
  'invalid-char-\'',
  'invalid-char-!',
  'invalid-char-*'
]

export const validElectrodeNativeModuleNames = [
  'MyApp',
  'myApi',
  'helloworld',
  'MYAPIIMPLEMENTATION'
]

export const invalidElectrodeNativeModuleNames = [
  'My-App',
  'my_app',
  'hell0w0rld',
  'my*app',
  'my$app'
]

export const miniAppNameWithSuffix = [
  'MiniAppTest',
  'TestMiniApp',
  'testminiapp',
  'miniappTest',
  'thisMiniAppIsValid'
]

export const apiNameWithSuffix = [
  'ApiTest',
  'TestApi',
  'testapi',
  'apiTest',
  'thisapiIsValid'
]

export const apiNativeImplNameWithSuffix = [
  'ApiImplNativeTest',
  'TestApiimplNative',
  'testapiImplNative',
  'apiImplNativeTest',
  'thisapiImplNativeIsValid'
]

export const apiJsImplNameWithSuffix = [
  'ApiImplJsTest',
  'TestApiimplJs',
  'testapiImplJs',
  'apiImplJsTest',
  'thisapiImplJsIsValid'
]

export const differentNativeApplicationPlatformDescriptors = [
  'testapp:android:1.0.0',
  'testapp:android:2.0.0',
  'testapp:ios:1.0.0',
  'testapp:android:3.0.0',
]

export const sameNativeApplicationPlatformDescriptors = [
  'testapp:android:1.0.0',
  'testapp:android:2.0.0',
  'testapp:android:3.0.0'
]

export const npmPkgNameExists = 'chai'
export const npmPkgNameDoesNotExists = 'zxc-pkg-not-in-npm-bnm'
export const npmPkgName = 'chai'
export const moduleTypeNotSupported = 'moduleTypeNotSupported'
export const validCompleteNapDescriptor = 'myapp:android:17.14.0'
export const validContainerVersions = ['1.2.3', '0.0.0', '123.456.789'];

export const invalidContainerVersions = ['123', '1.2', '1.2.x', 'x.y.z'];

export const withoutGitOrFileSystemPath = [
  'package@1.2.3',
  '@scope/package@1.2.3',
  undefined,
  null,
];

export const withGitOrFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git#master',
  'file:/Users/username',
];

export const withoutFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git#master',
  'package@1.2.3',
];

export const supportedCauldronMiniAppsVersions = [
  'git+ssh://github.com/MiniApp.git#master',
  'git+ssh://github.com/MiniApp.git#v1.0.0',
  'git+ssh://github.com/MiniApp.git#ea2e2d248c6af5eb14d76e4108ec922febd096f5',
  'https://github.com/MiniApp.git#master',
  'https://github.com/MiniApp.git#v1.0.0',
  'https://github.com/MiniApp.git#ea2e2d248c6af5eb14d76e4108ec922febd096f5',
  'MiniApp@1.0.0',
  'MiniApp@1.0.0-beta',
];

export const unSupportedCauldronMiniAppsVersions = [
  'git+ssh://github.com/MiniApp.git',
  'https://github.com/MiniApp.git',
  'MiniApp@^1.0.0',
  'MiniApp@~1.0.0',
];

export const withFileSystemPath = ['file:/Users/username'];

export const completeNapDescriptors = ['myapp:android:17.14.0', 'myapp:ios:1'];

export const incompleteNapDescriptors = ['myapp', 'myapp:android'];

export const validNpmPackageNames = ['hello-world', '@hello/world'];

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
  "invalid-char-'",
  'invalid-char-!',
  'invalid-char-*',
];

export const validElectrodeNativeModuleNames = [
  'MyApp',
  'myApi',
  'helloworld',
  'MYAPIIMPLEMENTATION',
  'hell0w0rld',
  'my_app',
];

export const invalidElectrodeNativeModuleNames = [
  'My-App',
  '1nvalid',
  'my*app',
  'my$app',
];

export const miniAppNameWithSuffix = [
  'MiniAppTest',
  'TestMiniApp',
  'testminiapp',
  'miniappTest',
  'thisMiniAppIsValid',
];

export const apiNameWithSuffix = [
  'ApiTest',
  'TestApi',
  'testapi',
  'apiTest',
  'thisapiIsValid',
];

export const apiNativeImplNameWithSuffix = [
  'ApiImplNativeTest',
  'TestApiimplNative',
  'testapiImplNative',
  'apiImplNativeTest',
  'thisapiImplNativeIsValid',
];

export const apiJsImplNameWithSuffix = [
  'ApiImplJsTest',
  'TestApiimplJs',
  'testapiImplJs',
  'apiImplJsTest',
  'thisapiImplJsIsValid',
];

export const differentNativeApplicationPlatformDescriptors = [
  'testapp:android:1.0.0',
  'testapp:android:2.0.0',
  'testapp:ios:1.0.0',
  'testapp:android:3.0.0',
];

export const sameNativeApplicationPlatformDescriptors = [
  'testapp:android:1.0.0',
  'testapp:android:2.0.0',
  'testapp:android:3.0.0',
];

export const npmPkgNameExists = 'chai';
export const npmPkgNameDoesNotExists = 'zxc-pkg-not-in-npm-bnm';
export const npmPkgName = 'chai';
export const moduleTypeNotSupported = 'moduleTypeNotSupported';
export const validCompleteNapDescriptor = 'myapp:android:17.14.0';

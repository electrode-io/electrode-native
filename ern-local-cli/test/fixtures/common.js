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
  'git+ssh://github.com:electrode/react-native.git',
  'git@github.com:electrode/react-native.git',
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
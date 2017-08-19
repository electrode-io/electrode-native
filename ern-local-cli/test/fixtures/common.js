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
  '@scope/package@1.2.3',
  [ 'package@1.2.3', '@scope/package@1.2.3' ]
]

export const withGitOrFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git',
  'git@github.com:electrode/react-native.git',
  'file:/Users/username',
  [ 'package@1.2.3', '@scope/package@1.2.3', 'git+ssh://github.com:electrode/react-native.git' ],
  [ 'package@1.2.3', '@scope/package@1.2.3', 'file:/Users/username' ],
  [ 'git+ssh://github.com:electrode/react-native.git', 'file:/Users/username' ]
]

export const completeNapDescriptors = [
  'myapp:android:17.14.0',
  'myapp:ios:1'
]

export const incompleteNapDescriptors = [
  'myapp',
  'myapp:android'
]
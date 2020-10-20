export const withoutGitOrFileSystemPath = [
  'package@1.2.3',
  '@scope/package@1.2.3',
];

export const withGitOrFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git#master',
  'file:/Users/username',
];

export const withoutFileSystemPath = [
  'git+ssh://github.com:electrode/react-native.git#master',
  'package@1.2.3',
];

export const withFileSystemPath = ['file:/Users/username'];

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

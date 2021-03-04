export const withoutGitOrFileSystemPath = [
  'package@1.2.3',
  '@scope/package@1.2.3',
  undefined,
  null,
];

export const withGitOrFileSystemPath = [
  'git+ssh://github.com:org/repo.git#master',
  'file:/home/user',
];

export const withoutFileSystemPath = [
  'git+ssh://github.com:org/repo.git#master',
  'package@1.2.3',
];

export const supportedCauldronMiniAppsVersions = [
  'git+ssh://github.com/org/test-miniapp.git#master',
  'git+ssh://github.com/org/test-miniapp.git#v1.0.0',
  'git+ssh://github.com/org/test-miniapp.git#ea2e2d248c6af5eb14d76e4108ec922febd096f5',
  'https://github.com/org/test-miniapp.git#master',
  'https://github.com/org/test-miniapp.git#v1.0.0',
  'https://github.com/org/test-miniapp.git#ea2e2d248c6af5eb14d76e4108ec922febd096f5',
  'test-miniapp@1.0.0',
  'test-miniapp@1.0.0-beta',
];

export const unSupportedCauldronMiniAppsVersions = [
  'git+ssh://github.com/org/test-miniapp.git',
  'https://github.com/org/test-miniapp.git',
  'test-miniapp@^1.0.0',
  'test-miniapp@~1.0.0',
];

export const withFileSystemPath = ['file:/home/user'];

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

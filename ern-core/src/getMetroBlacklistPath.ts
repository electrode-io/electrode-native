import semver from 'semver';

export function getMetroBlacklistPath(reactNativeVersion: string) {
  return semver.gte(reactNativeVersion, '0.64.0')
    ? 'metro-config/src/defaults/exclusionList'
    : 'metro-config/src/defaults/blacklist';
}

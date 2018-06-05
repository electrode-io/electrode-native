import semver from 'semver'

export function injectReactNativeVersionKeysInObject(
  object: any,
  reactNativeVersion: string
) {
  return Object.assign(object, {
    RN_VERSION_GTE_54: semver.gte(reactNativeVersion, '0.54.0'),
    RN_VERSION_LT_54: semver.lt(reactNativeVersion, '0.54.0'),
    reactNativeVersion,
  })
}

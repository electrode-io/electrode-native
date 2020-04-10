import semver from 'semver'

export function injectReactNativeVersionKeysInObject(
  object: any,
  reactNativeVersion: string
) {
  return Object.assign(object, {
    RN_VERSION_GTE_45: semver.gte(reactNativeVersion, '0.45.0'),
    RN_VERSION_GTE_54: semver.gte(reactNativeVersion, '0.54.0'),
    RN_VERSION_GTE_59: semver.gte(reactNativeVersion, '0.59.0'),
    RN_VERSION_GTE_60_1: semver.gte(reactNativeVersion, '0.60.1'),
    RN_VERSION_GTE_61: semver.gte(reactNativeVersion, '0.61.0'),
    RN_VERSION_LT_54: semver.lt(reactNativeVersion, '0.54.0'),
    RN_VERSION_LT_58: semver.lt(reactNativeVersion, '0.58.0-rc.2'),
    RN_VERSION_LT_59: semver.lt(reactNativeVersion, '0.59.0'),
    RN_VERSION_LT_61: semver.lt(reactNativeVersion, '0.61.0'),
    reactNativeVersion,
  })
}

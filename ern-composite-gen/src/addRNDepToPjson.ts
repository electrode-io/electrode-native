import { readPackageJson, writePackageJson } from 'ern-core';
import semver from 'semver';

export async function addRNDepToPjson(dir: string, version: string) {
  const compositePackageJson = await readPackageJson(dir);
  compositePackageJson.dependencies['react-native'] = version;

  // For React Native 0.77+, also add required dependencies
  // This is required by the new Metro config format and CLI
  if (semver.gte(version, '0.81.0')) {
    compositePackageJson.dependencies['@react-native/metro-config'] = version;
    compositePackageJson.dependencies['@react-native/babel-preset'] = version;
    // RN 0.81+ uses @react-native/community-cli-plugin (internal to RN monorepo)
    compositePackageJson.dependencies['@react-native/community-cli-plugin'] =
      version;
    // Add CLI packages to ensure android and ios platforms are available
    compositePackageJson.dependencies['@react-native-community/cli'] = '15.1.3';
    compositePackageJson.dependencies[
      '@react-native-community/cli-platform-android'
    ] = '15.1.3';
    compositePackageJson.dependencies[
      '@react-native-community/cli-platform-ios'
    ] = '15.1.3';
  } else if (semver.gte(version, '0.77.0')) {
    compositePackageJson.dependencies['@react-native/metro-config'] = version;
    compositePackageJson.dependencies['@react-native/babel-preset'] = version;
    // Add CLI packages to ensure android and ios platforms are available
    compositePackageJson.dependencies['@react-native-community/cli'] = '15.0.1';
    compositePackageJson.dependencies[
      '@react-native-community/cli-platform-android'
    ] = '15.0.1';
    compositePackageJson.dependencies[
      '@react-native-community/cli-platform-ios'
    ] = '15.0.1';
  }

  await writePackageJson(dir, compositePackageJson);
}

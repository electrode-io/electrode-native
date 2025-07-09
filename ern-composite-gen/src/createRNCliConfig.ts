import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

export async function createRNCliConfig({
  cwd,
  reactNativeVersion,
}: {
  cwd: string;
  reactNativeVersion?: string;
}) {
  // Check if we need to use the new RN CLI config format (React Native 0.73+)
  const useNewRNCLIConfig =
    reactNativeVersion && semver.gte(reactNativeVersion, '0.73.0');

  if (useNewRNCLIConfig) {
    // For React Native 0.73+, create a react-native.config.js that registers the platform CLI packages
    const rnCliConfig = `module.exports = {
  commands: [
    ...require('@react-native-community/cli-platform-android').commands,
    ...require('@react-native-community/cli-platform-ios').commands,
  ],
  platforms: {
    ...require('@react-native-community/cli-platform-android').platforms,
    ...require('@react-native-community/cli-platform-ios').platforms,
  },
};`;
    await fs.writeFile(path.join(cwd, 'react-native.config.js'), rnCliConfig);
  } else {
    // Legacy RN CLI config for older versions
    const sourceExts =
      "module.exports = { resolver: { sourceExts: ['jsx', 'js', 'ts', 'tsx', 'mjs'] } };";
    await fs.writeFile(path.join(cwd, 'rn-cli.config.js'), sourceExts);
  }
}

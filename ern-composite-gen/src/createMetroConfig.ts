import fs from 'fs-extra';
import path from 'path';
import beautify from 'js-beautify';
import os from 'os';

export async function createMetroConfig({
  cwd,
  projectRoot,
  blacklistRe,
  extraNodeModules,
  watchFolders,
}: {
  cwd?: string;
  projectRoot?: string;
  blacklistRe?: RegExp[];
  extraNodeModules?: { [pkg: string]: string };
  watchFolders?: string[];
}) {
  // Metro config format for React Native 0.73+
  const metroConfigContent = `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  ${projectRoot ? `projectRoot: "${projectRoot}",` : ''}
  ${
    watchFolders
      ? `watchFolders: [
        ${watchFolders
          .map((x) => `"${x.replace(/\\/g, '\\\\')}"`)
          .join(`,${os.EOL}`)}
      ],`
      : ''
  }
  resolver: {
    ...defaultConfig.resolver,
    ${
      extraNodeModules
        ? `extraNodeModules: ${JSON.stringify(extraNodeModules, null, 2)},`
        : ''
    }
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      // Archives (virtual files)
      "zip"
    ],
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
      "svg", 
      "mjs"
    ],
    blockList: [
      // Ignore IntelliJ directories
      /.*\\.idea\\/.*/,
      // ignore git directories
      /.*\\.git\\/.*/,
      // Ignore android directories
      /.*\\/app\\/build\\/.*/,
      ${blacklistRe ? blacklistRe.join(`,${os.EOL}`) : ''}
    ],
  },
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
    assetPlugins: ['ern-bundle-store-metro-asset-plugin'],
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
};

module.exports = mergeConfig(defaultConfig, config);`;

  return fs.writeFile(
    path.join(cwd ?? path.resolve(), 'metro.config.js'),
    beautify.js(metroConfigContent),
  );
}

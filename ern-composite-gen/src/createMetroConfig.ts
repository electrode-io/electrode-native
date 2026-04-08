import fs from 'fs-extra';
import path from 'path';
import beautify from 'js-beautify';
import os from 'os';
import semver from 'semver';
import { getMetroBlacklistPath } from 'ern-core';

export async function createMetroConfig({
  cwd,
  projectRoot,
  blacklistRe,
  extraNodeModules,
  watchFolders,
  reactNativeVersion,
}: {
  cwd?: string;
  projectRoot?: string;
  blacklistRe?: RegExp[];
  extraNodeModules?: { [pkg: string]: string };
  watchFolders?: string[];
  reactNativeVersion?: string;
}) {
  const useModernConfig =
    reactNativeVersion && semver.gte(reactNativeVersion, '0.73.0');

  const metroConfigContent = useModernConfig
    ? createModernMetroConfig({
        projectRoot,
        blacklistRe,
        extraNodeModules,
        watchFolders,
      })
    : createLegacyMetroConfig({
        projectRoot,
        blacklistRe,
        extraNodeModules,
        watchFolders,
        reactNativeVersion: reactNativeVersion || '0.60.0',
      });

  return fs.writeFile(
    path.join(cwd ?? path.resolve(), 'metro.config.js'),
    beautify.js(metroConfigContent),
  );
}

// Metro config format for React Native 0.73+
function createModernMetroConfig({
  projectRoot,
  blacklistRe,
  extraNodeModules,
  watchFolders,
}: {
  projectRoot?: string;
  blacklistRe?: RegExp[];
  extraNodeModules?: { [pkg: string]: string };
  watchFolders?: string[];
}): string {
  return `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
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
}

// Legacy Metro config format for React Native < 0.73
function createLegacyMetroConfig({
  projectRoot,
  blacklistRe,
  extraNodeModules,
  watchFolders,
  reactNativeVersion,
}: {
  projectRoot?: string;
  blacklistRe?: RegExp[];
  extraNodeModules?: { [pkg: string]: string };
  watchFolders?: string[];
  reactNativeVersion: string;
}): string {
  return `const blacklist = require('${getMetroBlacklistPath(
    reactNativeVersion,
  )}');
module.exports = {
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
    blacklistRE: blacklist([
      // Ignore IntelliJ directories
      /.*\\.idea\\/.*/,
      // ignore git directories
      /.*\\.git\\/.*/,
      // Ignore android directories
      /.*\\/app\\/build\\/.*/,
      ${blacklistRe ? blacklistRe.join(`,${os.EOL}`) : ''}
    ]),
    ${
      extraNodeModules
        ? `extraNodeModules: ${JSON.stringify(extraNodeModules, null, 2)},`
        : ''
    }
    assetExts: [
      // Image formats
      "bmp",
      "gif",
      "jpg",
      "jpeg",
      "png",
      "psd",
      "webp",
      // Video formats
      "m4v",
      "mov",
      "mp4",
      "mpeg",
      "mpg",
      "webm",
      // Audio formats
      "aac",
      "aiff",
      "caf",
      "m4a",
      "mp3",
      "wav",
      // Document formats
      "html",
      "pdf",
      // Font formats
      "otf",
      "ttf",
      // Archives (virtual files)
      "zip"
    ],
    sourceExts: ["js", "json", "ts", "tsx", "svg", "mjs"],
  },
  transformer: {
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
`;
}

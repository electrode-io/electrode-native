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
  reactNativeVersion: string;
}) {
  return fs.writeFile(
    path.join(cwd ?? path.resolve(), 'metro.config.js'),
    beautify.js(`const blacklist = require('${getMetroBlacklistPath(
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
    sourceExts: ["js", "json", "ts", "tsx", "svg"],
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
`),
  );
}

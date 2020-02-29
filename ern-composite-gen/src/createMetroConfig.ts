import fs from 'fs-extra'
import path from 'path'

export async function createMetroConfig({ cwd }: { cwd: string }) {
  return fs.writeFile(
    path.join(cwd, 'metro.config.js'),
    `const blacklist = require('metro-config/src/defaults/blacklist');
module.exports = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
    blacklistRE: blacklist([
      // Ignore IntelliJ directories
      /.*\\.idea\\/.*/,
      // ignore git directories
      /.*\\.git\\/.*/,
      // Ignore android directories
      /.*\\/app\\/build\\/.*/,
    ]),
    assetExts: [
      // Image formats
      "bmp",
      "gif",
      "jpg",
      "jpeg",
      "png",
      "psd",
      "svg",
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
    ]
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
    assetPlugins: ['ern-bundle-store-metro-asset-plugin'],
  },
};
`
  )
}

import {
  findDirectoriesHavingRnConfig,
  handleCopyDirective,
  NativePlatform,
  log,
} from 'ern-core';
import { getAssetsPath } from './getAssetsPath';
import readDir from 'fs-readdir-recursive';
import path from 'path';
import fs from 'fs-extra';
import semver from 'semver';

export const supportedAssetsExts = ['.ttf', '.otf'];

/**
 * Copy in Container, the assets of all packages found in Composite,
 * that are exporting assets through react-native.config.js.
 * Similar to React Native, only fonts (.ttf/.otf) are supported for now.
 * This will copy the font assets of all packages that are either
 * dependencies:
 * https://github.com/react-native-community/cli/blob/master/docs/dependencies.md
 * or projects:
 * https://github.com/react-native-community/cli/blob/master/docs/projects.md
 */
export async function copyRnConfigAssets({
  compositePath,
  outDir,
  platform,
}: {
  compositePath: string;
  outDir: string;
  platform: NativePlatform;
}) {
  const pJson = await fs.readJSON(path.join(compositePath, 'package.json'));
  const rnVersion = pJson.dependencies['react-native'];
  const dirs = await findDirectoriesHavingRnConfig(compositePath);

  for (const dir of dirs) {
    const rnConfig: any = require(path.join(dir, 'react-native.config.js'));
    const assets =
      rnConfig.assets || (rnConfig.dependency && rnConfig.dependency.assets);
    if (assets) {
      if (platform === 'ios' && semver.gte(rnVersion, '0.61.0')) {
        const files = await fs.readdir(dir);
        if (files.some((f) => f.endsWith('.podspec'))) {
          log.debug(
            `Skipping assets copy to container for ${dir} as it contains a podspec so the resources will be copied over by pod install`,
          );
          continue;
        }
      }
      for (const assetDir of assets) {
        const absDir = path.join(dir, assetDir);
        readDir(absDir)
          .filter((p) => {
            return supportedAssetsExts.includes(path.extname(p));
          })
          .map((p) => path.join(assetDir, p))
          .forEach((p) => {
            handleCopyDirective(dir, outDir, [
              { source: p, dest: getAssetsPath(platform, 'fonts') },
            ]);
          });
      }
    }
  }
}

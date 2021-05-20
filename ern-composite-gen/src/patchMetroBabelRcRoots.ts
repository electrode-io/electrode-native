import { log } from 'ern-core';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

export async function patchMetroBabelRcRoots({
  babelRcRootsRe,
  cwd,
  metroVersion,
  rnVersion,
}: {
  babelRcRootsRe: RegExp[];
  cwd: string;
  metroVersion: string;
  rnVersion: string;
}) {
  // If React Native version is greater or equal than 0.56.0
  // it is using Babel 7
  // In that case, because we still want to process .babelrc
  // of some MiniApps that need their .babelrc to be processed
  // during bundling, we need to use the babelrcRoots option of
  // Babel 7 (https://babeljs.io/docs/en/options#babelrcroots)
  // Unfortunately, there is no way -as of metro latest version-
  // to provide this option to the metro bundler.
  // A pull request will be opened to metro to properly support
  // this option, but meanwhile, we are just directly patching the
  // metro transformer source file to make use of this option.
  // This code will be kept even when a new version of metro supporting
  // this option will be released, to keep backward compatibility.
  // It will be deprecated at some point.
  const cwdNodeModules = path.join(cwd, 'node_modules');
  const pathToFilesToPatch = [];
  if (semver.gte(rnVersion, '0.56.0') && babelRcRootsRe.length > 0) {
    if (semver.lt(metroVersion, '0.51.0')) {
      // For versions of metro < 0.51.0, we are patching the reactNativeTransformer.js file
      // https://github.com/facebook/metro/blob/v0.50.0/packages/metro/src/reactNativeTransformer.js#L120
      pathToFilesToPatch.push(
        path.join(cwdNodeModules, 'metro/src/reactNativeTransformer.js'),
      );
    } else {
      // For versions of metro >= 0.51.0, we are patching the index.js file
      // https://github.com/facebook/metro/blob/v0.51.0/packages/metro-react-native-babel-transformer/src/index.js#L120
      const pathInCommunityCli = path.join(
        cwdNodeModules,
        '@react-native-community/cli/node_modules/metro-react-native-babel-transformer/src/index.js',
      );
      if (await fs.pathExists(pathInCommunityCli)) {
        pathToFilesToPatch.push(pathInCommunityCli);
      }
      const pathInRoot = path.join(
        cwdNodeModules,
        'metro-react-native-babel-transformer/src/index.js',
      );
      if (await fs.pathExists(pathInRoot)) {
        pathToFilesToPatch.push(pathInRoot);
      }
    }

    for (const pathToFileToPatch of pathToFilesToPatch) {
      log.debug(`[patchMetroBabelRcRoots] Patching ${pathToFileToPatch}`);
      const fileToPatch = await fs.readFile(pathToFileToPatch);
      const lineToPatch = semver.lt(metroVersion, '0.64.0')
        ? `let config = Object.assign({}, babelRC, extraConfig);`
        : `const extraConfig = {`;
      // Just add extra code line to inject babelrcRoots option

      const patch = semver.lt(metroVersion, '0.64.0')
        ? `extraConfig.babelrcRoots = [
  ${babelRcRootsRe.map((b) => b.toString()).join(',')} ]
  ${lineToPatch}`
        : `${lineToPatch} babelrcRoots: [${babelRcRootsRe
            .map((b) => b.toString())
            .join(',')}],`;
      const patchedFile = fileToPatch.toString().replace(lineToPatch, patch);
      await fs.writeFile(pathToFileToPatch, patchedFile);
    }
  }
}

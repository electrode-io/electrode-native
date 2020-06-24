import fs from 'fs-extra';
import path from 'path';

//
// Patch a metro bug related to BABEL_ENV resolution
// This bug was fixed in metro through:
// https://github.com/facebook/metro/commit/c509a89af9015b6d6b34c07a26ea59b73d87cd53
// It has not been released yet and will anyway not be available for older
// versions of React Native.
// Patching is therefore done here, independently of the version of RN used.
// We can keep this patch potentially forever as the replacement it is doing can
// also be safely applied in any case, even on top of a metro release that contain the fix.
export async function patchMetroBabelEnv({ cwd }: { cwd: string }) {
  const filesToPach = [
    path.join(
      cwd,
      'node_modules/metro-react-native-babel-transformer/src/index.js',
    ),
    path.join(cwd, 'node_modules/metro-babel-transformer/src/index.js'),
  ];
  const stringToReplace = 'process.env.BABEL_ENV = OLD_BABEL_ENV;';
  const replacementString =
    'if (OLD_BABEL_ENV) { process.env.BABEL_ENV = OLD_BABEL_ENV; }';
  for (const fileToPatch of filesToPach) {
    if (await fs.pathExists(fileToPatch)) {
      const file = await fs.readFile(fileToPatch);
      const patchedFile = file
        .toString()
        .replace(stringToReplace, replacementString);
      await fs.writeFile(fileToPatch, patchedFile);
    }
  }
}

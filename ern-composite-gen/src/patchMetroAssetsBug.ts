import fs from 'fs-extra';
import path from 'path';
import { log } from 'ern-core';

// Hot apply patch from https://github.com/facebook/metro/pull/533
export async function patchMetroAssetsBug({ cwd }: { cwd: string }) {
  const compositeNodeModulesPath = path.join(cwd, 'node_modules');

  const pathToFileToPatch = path.join(
    compositeNodeModulesPath,
    'metro/src/Assets.js',
  );
  if (!(await fs.pathExists(pathToFileToPatch))) {
    return log.debug(
      `patchMetroAssetsBug: ${pathToFileToPatch} doest not exist. Skipping patch.`,
    );
  }
  const fileContent = await fs.readFile(pathToFileToPatch, {
    encoding: 'utf8',
  });
  const firstStringToReplace = `if (path.sep === "\\\\") {`;
  const secondStringToReplace = `const absolutePath = path.resolve(projectRoot, relativePath);`;
  if (
    !fileContent.includes(firstStringToReplace) ||
    !fileContent.includes(secondStringToReplace)
  ) {
    return log.debug(
      `patchMetroAssetsBug: Cannot find strings to replace in ${pathToFileToPatch}. Skipping patch.`,
    );
  }
  const firstReplacementString = `
// Patched by Electrode Native (patchMetroAssetsBug)
// to apply fix from https://github.com/facebook/metro/pull/533
const escapedLocalPath = localPath.replace(/\\.\\.\\//g, '__/');
assetUrlPath = path.join(publicPath, path.dirname(escapedLocalPath));
// End of Electrode Native patch
${firstStringToReplace}
`;
  const secondReplacementString = `
// Patched by Electrode Native (patchMetroAssetsBug) 
// to apply fix from https://github.com/facebook/metro/pull/533
const absolutePath = path.resolve(
  projectRoot,
  relativePath.replace(/__(\\/|\\\\)/g, '..$1'),
);
// End of Electrode Native patch
`;
  log.debug(`patchMetroAssetsBug: Patching ${pathToFileToPatch}`);
  const patchedFileContent = fileContent
    .replace(firstStringToReplace, firstReplacementString)
    .replace(secondStringToReplace, secondReplacementString);

  return fs.writeFile(pathToFileToPatch, patchedFileContent);
}

import fs from 'fs-extra';
import path from 'path';
import { readPackageJson } from 'ern-core';
import { getNodeModuleVersion } from './getNodeModuleVersion';
import { patchMetroBabelRcRoots } from './patchMetroBabelRcRoots';

export async function patchWorkspaceBabelRcRoots({ cwd }: { cwd: string }) {
  const rnVersion = await getNodeModuleVersion({
    cwd,
    name: 'react-native',
  });
  const metroVersion = await getNodeModuleVersion({
    cwd,
    name: 'metro',
  });

  const miniappsPath = path.join(cwd, 'miniapps');
  const babelRcRootsRe: RegExp[] = [];
  for (const file of await fs.readdir(miniappsPath)) {
    const f = path.join(miniappsPath, file);
    if ((await fs.stat(f)).isDirectory()) {
      const pJson = await readPackageJson(path.join(f));
      if (pJson.ern?.useBabelRc === true) {
        babelRcRootsRe.push(new RegExp(`${path.basename(f)}(?!.+\/)`));
      }
    }
  }

  return patchMetroBabelRcRoots({
    babelRcRootsRe,
    cwd,
    metroVersion,
    rnVersion,
  });
}

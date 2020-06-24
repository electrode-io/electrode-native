import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import { kax, log, PackagePath, shell, writePackageJson, yarn } from 'ern-core';
import {
  getMiniAppsDeltas,
  getPackageJsonDependenciesUsingMiniAppDeltas,
  MiniAppsDeltas,
  runYarnUsingMiniAppDeltas,
} from './miniAppsDeltasUtils';

export async function installPackagesUsingYarnLock({
  cwd,
  pathToYarnLock,
  jsPackages,
}: {
  cwd: string;
  pathToYarnLock: string;
  jsPackages: PackagePath[];
}) {
  shell.pushd(cwd);
  try {
    const compositePackageJson: any = {};

    if (_.some(jsPackages, (m) => !m.version)) {
      throw new Error(
        '[generateComposite] When providing a yarn lock you cannot pass MiniApps without an explicit version',
      );
    }

    if (!(await fs.pathExists(pathToYarnLock))) {
      throw new Error(
        `[generateComposite] Path to yarn.lock does not exist (${pathToYarnLock})`,
      );
    }

    log.debug(`Copying yarn.lock to ${cwd}`);
    shell.cp(pathToYarnLock, path.join(cwd, 'yarn.lock'));

    const yarnLock = await fs.readFile(pathToYarnLock, 'utf8');
    const miniAppsDeltas: MiniAppsDeltas = getMiniAppsDeltas(
      jsPackages,
      yarnLock,
    );

    log.debug(
      `[generateComposite] miniAppsDeltas: ${JSON.stringify(miniAppsDeltas)}`,
    );

    compositePackageJson.dependencies = getPackageJsonDependenciesUsingMiniAppDeltas(
      miniAppsDeltas,
      yarnLock,
    );

    await writePackageJson(cwd, compositePackageJson);

    // Now that the composite package.json is similar to the one used to generated yarn.lock
    // we can run yarn install to get back to the exact same dependency graph as the previously
    // generated composite
    await kax.task('Running yarn install').run(yarn.install());
    return runYarnUsingMiniAppDeltas(miniAppsDeltas);
  } finally {
    shell.popd();
  }
}

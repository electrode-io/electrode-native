import _ from 'lodash';
import { log, PackagePath } from 'ern-core';
import { installPackagesUsingYarnLock } from './installPackagesUsingYarnLock';
import { installPackagesWithoutYarnLock } from './installPackagesWithoutYarnLock';

export async function installPackages({
  cwd,
  jsApiImplDependencies,
  miniApps,
  pathToYarnLock,
}: {
  cwd: string;
  jsApiImplDependencies?: PackagePath[];
  miniApps: PackagePath[];
  pathToYarnLock?: string;
}) {
  const jsPackages = jsApiImplDependencies
    ? [...miniApps, ...jsApiImplDependencies]
    : miniApps;

  if (pathToYarnLock && _.some(jsPackages, (p) => p.isFilePath)) {
    log.warn(
      'Yarn lock will not be used as some of the MiniApp paths are file based',
    );
    pathToYarnLock = undefined;
  }

  return pathToYarnLock
    ? installPackagesUsingYarnLock({
        cwd,
        jsPackages,
        pathToYarnLock,
      })
    : installPackagesWithoutYarnLock({ cwd, jsPackages });
}

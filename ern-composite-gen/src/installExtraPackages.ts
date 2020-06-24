import { PackagePath, shell, yarn } from 'ern-core';

export async function installExtraPackages({
  cwd,
  extraJsDependencies,
}: {
  cwd: string;
  extraJsDependencies: PackagePath[];
}) {
  shell.pushd(cwd);
  try {
    for (const extraJsDependency of extraJsDependencies || []) {
      await yarn.add(extraJsDependency);
    }
  } finally {
    shell.popd();
  }
}

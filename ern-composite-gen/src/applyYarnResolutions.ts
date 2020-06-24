import { log, readPackageJson, shell, writePackageJson, yarn } from 'ern-core';

export async function applyYarnResolutions({
  cwd,
  resolutions,
}: {
  cwd: string;
  resolutions: { [pkg: string]: string };
}) {
  log.debug('Adding yarn resolutions to package.json');
  log.trace(`resolutions : ${JSON.stringify(resolutions, null, 2)}`);
  const compositePackageJson = await readPackageJson(cwd);
  compositePackageJson.resolutions = resolutions;
  await writePackageJson(cwd, compositePackageJson);
  try {
    shell.pushd(cwd);
    await yarn.install();
  } finally {
    shell.popd();
  }
}

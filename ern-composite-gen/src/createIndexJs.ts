import path from 'path';
import fs from 'fs-extra';
import { readPackageJson, PackagePath } from 'ern-core';

export async function createIndexJs({
  cwd,
  jsApiImplDependencies = [],
  miniApps,
}: {
  cwd: string;
  jsApiImplDependencies: PackagePath[];
  miniApps: PackagePath[];
}) {
  let entryIndexJsContent = '';

  const compositePackageJson = await readPackageJson(cwd);

  for (const dependency of [...jsApiImplDependencies, ...miniApps]) {
    // Add dependency imports strictly matching miniapps array order
    // For git based dependencies we have to rely on some trickery to
    // find the package name, as it won't be set in the PackagePath
    // We just look in the composite package.json for a match on
    // the path, and get the package name from there.
    //
    // Sample git package in package.json:
    // "bar": "git+ssh://github.com/foo/bar.git#master"
    const pkgName = dependency.isGitPath
      ? Object.entries(compositePackageJson.dependencies).find(
          ([, v]) => v === dependency.fullPath,
        )![0]
      : dependency.name;
    entryIndexJsContent += `import '${pkgName}'\n`;
  }

  await fs.writeFile(path.join(cwd, 'index.js'), entryIndexJsContent);
  // Still also generate index.android.js and index.ios.js for backward compatibility with
  // Container generated with Electrode Native < 0.33.0, as these Containers are still
  // looking for these files.
  // TO BE REMOVED IN 0.40.0
  await fs.writeFile(path.join(cwd, 'index.ios.js'), entryIndexJsContent);
  await fs.writeFile(path.join(cwd, 'index.android.js'), entryIndexJsContent);
}

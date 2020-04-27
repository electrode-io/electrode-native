import path from 'path';
import fs from 'fs-extra';
import { readPackageJson } from 'ern-core';

export async function createIndexJs({
  cwd,
  extraImports = [],
}: {
  cwd: string;
  extraImports?: string[];
}) {
  let entryIndexJsContent = '';

  const dependencies: string[] = [...extraImports];
  const compositePackageJson = await readPackageJson(cwd);
  for (const dependency of Object.keys(
    compositePackageJson.dependencies || [],
  )) {
    dependencies.push(dependency);
  }
  dependencies.forEach(d => {
    entryIndexJsContent += `import '${d}'\n`;
  });

  await fs.writeFile(path.join(cwd, 'index.js'), entryIndexJsContent);
  // Still also generate index.android.js and index.ios.js for backward compatibility with
  // Container generated with Electrode Native < 0.33.0, as these Containers are still
  // looking for these files.
  // TO BE REMOVED IN 0.40.0
  await fs.writeFile(path.join(cwd, 'index.ios.js'), entryIndexJsContent);
  await fs.writeFile(path.join(cwd, 'index.android.js'), entryIndexJsContent);
}

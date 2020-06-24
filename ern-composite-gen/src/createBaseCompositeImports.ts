import fs from 'fs-extra';
import path from 'path';
import { readPackageJson } from 'ern-core';

export async function createBaseCompositeImports({ cwd }: { cwd: string }) {
  let content = '';

  const dependencies: string[] = [];
  const compositePackageJson = await readPackageJson(cwd);
  for (const dependency of Object.keys(compositePackageJson.dependencies)) {
    content += `import '${dependency}'\n`;
    dependencies.push(dependency);
  }

  await fs.writeFile(path.join(cwd, 'composite-imports.js'), content);
}

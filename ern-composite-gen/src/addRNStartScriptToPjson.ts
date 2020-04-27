import { readPackageJson, writePackageJson } from 'ern-core';

export async function addRNStartScriptToPjson({ cwd }: { cwd: string }) {
  const packageJson = await readPackageJson(cwd);
  packageJson.scripts = packageJson.scripts ?? {};
  packageJson.scripts.start =
    'node node_modules/react-native/local-cli/cli.js start';
  await writePackageJson(cwd, packageJson);
}

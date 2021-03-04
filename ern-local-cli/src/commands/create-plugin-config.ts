import {
  createTmpDir,
  PackagePath,
  PluginConfigGenerator,
  promptUtils,
  readPackageJson,
  shell,
  yarn,
} from 'ern-core';

import { askUserInput, epilog, tryCatchWrap } from '../lib';
import { Argv } from 'yargs';
import fs from 'fs-extra';
import path from 'path';

export const command = 'create-plugin-config <plugin>';
export const desc = 'Create plugin configuration for the manifest';
export const builder = (argv: Argv) => {
  return argv.coerce('plugin', PackagePath.fromString).epilog(epilog(exports));
};

// Bump this version whenever Electrode Native plugin configuration
// offers new features or has structural changes
const manifestBaseErnVersion = '0.46.0';

export const commandHandler = async ({ plugin }: { plugin: PackagePath }) => {
  if (!(await fs.pathExists('manifest.json'))) {
    throw new Error(`No manifest.json file found in current directory.
Make sure this command is run from a Manifest directory.`);
  }

  const tmpDir = createTmpDir();

  try {
    shell.pushd(tmpDir);
    await yarn.init();
    await yarn.add(plugin);
  } finally {
    shell.popd();
  }

  const pluginPath = path.join(tmpDir, 'node_modules', plugin.name!);
  const conf = await PluginConfigGenerator.generateFromPath({
    pluginPath,
    resolveDependencyVersion: (x) =>
      askUserInput({
        message: `Cannot resolve version for ${x}. Enter the version to use`,
      }),
    resolvePbxProjPath: (x) =>
      promptUtils.askUserToChooseAnOption(
        x,
        'Select the .pbxproj associated to this plugin',
      ),
    revolveBuildGradlePath: (x) =>
      promptUtils.askUserToChooseAnOption(
        x,
        'Select the build.gradle associated to this plugin',
      ),
  });
  const pluginPackageJson = await readPackageJson(pluginPath);
  const pluginVersion = pluginPackageJson.version;
  const pathToPluginConfig = path.join(
    'plugins',
    `ern_v${manifestBaseErnVersion}+`,
    `${plugin.name}_v${pluginVersion}+`,
  );
  if (!(await fs.pathExists(pathToPluginConfig))) {
    await shell.mkdir('-p', pathToPluginConfig);
  } else {
    throw new Error(`path ${pathToPluginConfig} already exist`);
  }
  await fs.writeFile(
    path.join(pathToPluginConfig, 'config.json'),
    JSON.stringify(conf.pluginConfig, null, 2).concat('\n'),
  );
  if (conf.androidPluginSource) {
    await fs.writeFile(
      path.join(pathToPluginConfig, conf.androidPluginSource.filename),
      conf.androidPluginSource.content,
    );
  }
};

export const handler = tryCatchWrap(commandHandler);

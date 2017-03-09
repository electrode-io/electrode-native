import runModelGen from "@walmart/ern-model-gen";
import generateJavaCode from './generateJavaCode';
import generateObjectiveCCode from './generateObjectiveCCode';
import generateProject from './generateProject';
import generateJSCode from './generateJSCode';
import {patchHull} from './renderer';
import normalizeConfig from './normalizeConfig';
import views from './views';
import fs from 'fs';
import shell from 'shelljs';
import path from 'path';
import {SCHEMA_FILE, PKG_FILE, MODEL_FILE} from './Constants';
import log from './log';
import {readJSON, writeFile} from './fileUtil';
import {platform} from '@walmart/ern-util'
import inquirer from 'inquirer';

// Not pretty but depending of the execution context (direct call to binary v.s
// using api-gen in a node program) the path might include distrib This is just
// a temporary work-around, find out a cleaner way
const apiGenDir = path.join(__dirname, '..');

/**
 * Generate JS/Android code
 * view : the mustache view to use
 */
async function generateAllCode(view) {
  await generateJavaCode(view, apiGenDir);
  await generateObjectiveCCode(view, apiGenDir);
  await generateJSCode(view, apiGenDir);
}

function hasModelSchema(modelsSchemaPath = `${process.cwd()}/${MODEL_FILE}`) {
  return fs.existsSync(modelsSchemaPath) && modelsSchemaPath;
}

/**
 * ==============================================================================
 * Main entry point
 * ==============================================================================
 *
 * Refer to normalizeConfig function doc for the list of options
 */
export async function generateApi(options) {
  let config = normalizeConfig(options);

  const outFolder = `${process.cwd()}/${config.moduleName}`;
  if (fs.existsSync(outFolder)) {
    log.warn(`A directory already exists at ${outFolder}`);
    process.exit(1);
  }

  // Create output folder
  shell.mkdir(outFolder);
  await generateProject(config, outFolder);
  shell.cd(outFolder);
  await generateCode(config);
  log.info(`==  Generated project:$ cd ${outFolder}`);
}

export async function cleanGenerated(outFolder = process.cwd()) {
  const pkg = await checkValid(`Is this not an api directory try a directory named: react-native-{name}-api`);

  shell.rm('-rf', path.join(outFolder, 'js'));
  shell.rm('-rf', path.join(outFolder, 'ios'));
  shell.rm('-rf', path.join(outFolder, 'android'));
  shell.rm('-f', path.join(outFolder, 'index.js'));
  return pkg;
}

async function checkValid(message) {
  const outFolder = process.cwd();

  if (!/react-native-(.*)-api$/.test(outFolder) || !fs.existsSync(`${process.cwd()}/${SCHEMA_FILE}`)) {
    throw new Error(message);
  }
  let pkg;
  try {
    pkg = await readJSON(`${process.cwd()}/${PKG_FILE}`);
  } catch (e) {
    throw new Error(message);
  }
  if (!/react-native-(.*)-api$/.test(pkg.name)) {
    throw new Error(message);
  }
  return pkg;
}

export async function generateCode(options) {
  log.info('== Regenerating Code');
  const pkg = await cleanGenerated();

  let versionNums = pkg.version.split("."); //Split major.minor.patch
  let newPluginVer;
  if (!isNaN(versionNums[2])) {
    versionNums[2]++;
    newPluginVer = versionNums.join('.');
  }
  if (newPluginVer === undefined) {
    //Directly ask for version of the plugin
    await _promptForPluginVersion(pkg.version).then((answer) => {
      newPluginVer = answer.userPluginVer;
    });
  } else {
    const answers = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmPluginVer',
      message: `Would you like to use plugin version ${newPluginVer} for ${pkg.name}?`
    }]);
    if (!answers.confirmPluginVer) {
      const answer = await _promptForPluginVersion(pkg.version);
      newPluginVer = answer.userPluginVer;
    }
  }
  pkg.version = newPluginVer;
  await _checkDependencyVersion(pkg);
  writeFile(`${process.cwd()}/${PKG_FILE}`,JSON.stringify(pkg, null, 2)); //Write the new package properties
  const config = normalizeConfig(Object.assign({}, {
    name: pkg.name,
    apiVersion: pkg.version,
    apiDescription: pkg.description,
    apiAuthor: pkg.author
  }, options));

  _startCodeRegen(config);
}

function _promptForPluginVersion(curVersion) {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'userPluginVer',
      message: `Current Plugin Version is ${curVersion}. Type the new plugin version (major.minor.patch)?`
    }
  ]);
}

async function _checkDependencyVersion(pkg) {
  let pluginDependency = pkg.dependencies;
  let supportedPluginsMap = _constructSupportedPluginsMap();
  for (const key of Object.keys(pluginDependency)) {
    if (supportedPluginsMap.has(key) && pluginDependency[key] !== supportedPluginsMap.get(key)) {
      const answer = await _promptForMissMatchOfSupportedPlugins(supportedPluginsMap.get(key), key)
      pluginDependency[key] = answer.userPluginVer ? answer.userPluginVer : supportedPluginsMap.get(key);
    }
  }
}

function _constructSupportedPluginsMap() {
  let platformManifest = platform.getManifest(platform.currentVersion)
  let supportedPluginsMap = new Map(
    platformManifest.supportedPlugins.map((currVal) => {
      if (currVal == null) return [];
      let idx = currVal.lastIndexOf('@'); //logic for scoped dependency
      return [currVal.substring(0, idx), currVal.substring(idx + 1)];
    }));
  return supportedPluginsMap;
}

function _promptForMissMatchOfSupportedPlugins(curVersion, pluginName) {
  return inquirer.prompt([{
    type: 'input',
    name: 'userPluginVer',
    message: `Type new plugin version of ${pluginName}. Press Enter to use the default '${curVersion}'.`
  }]);
}

async function _startCodeRegen(config) {
  const outFolder = process.cwd();
  // Copy the api hull (skeleton code with inline templates) to output folder
  shell.cp('-r', `${apiGenDir}/api-hull/*`, outFolder);

  // --------------------------------------------------------------------------
  // Mustache view creation
  // --------------------------------------------------------------------------

  const mustacheView = await views(config, outFolder);

  // --------------------------------------------------------------------------
  // Kickstart generation
  // --------------------------------------------------------------------------
  // Start by patching the api hull "inplace"
  log.info("== Patching Hull");
  await patchHull(mustacheView);
  // Inject all additional generated code
  log.info("== Generating API code");
  await generateAllCode(mustacheView);

  const schemaPath = hasModelSchema(config.modelsSchemaPath);

  if (schemaPath) {
    await runModelGen({
      javaModelDest: `${outFolder}/android/lib/src/main/java/${config
        .namespace
        .replace(/\./g, '/')}/${config
        .apiName}/model`,
      javaPackage: `${config
        .namespace}.${config
        .apiName
        .toLowerCase()}.model`,
      objCModelDest: `${outFolder}/ios/MODEL`,
      schemaPath
    });
  }
  log.info("== Generation complete");
}
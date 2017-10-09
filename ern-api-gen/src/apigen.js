// @flow

import generateProject, { generateSwagger, generateFlowConfig } from './generateProject'
import normalizeConfig from './normalizeConfig'
import fs from 'fs'
import shell from 'shelljs'
import path from 'path'
import semver from 'semver'
import {
  PKG_FILE,
  FLOW_CONFIG_FILE,
  FLOW_BIN_VERSION
} from './Constants'
import {
  Dependency,
  fileUtils,
  npm
} from 'ern-util'
import inquirer from 'inquirer'

/**
 * ==============================================================================
 * Main entry point
 * ==============================================================================
 *
 * Refer to normalizeConfig function doc for the list of options
 */
export async function generateApi (options: Object) {
  let config = normalizeConfig(options)

  const outFolder = `${process.cwd()}/${config.moduleName}`
  if (fs.existsSync(outFolder)) {
    log.error(`${outFolder} directory already exists`)
    process.exit(1)
  }

  // Create output folder
  shell.mkdir(outFolder)
  await generateProject(config, outFolder)
  log.info(`==  Project was generated in ${outFolder}`)
}

/**
 * If updatePlugin is specified it will not attempt to update the version.
 * It'll just do its job.
 *
 * Otherwise it will try to get the next version.
 *
 * @param options
 * @returns {Promise.<void>}
 */
export async function regenerateCode (options: Object = {}) {
  const pkg = await checkValid(`This is not a properly named API directory. Naming convention is react-native-{name}-api`)
  const curVersion = pkg.version || '0.0.1'
  let newPluginVer
  if (options.updatePlugin) {
    newPluginVer = nextVersion(curVersion, options.updatePlugin)
  } else {
    newPluginVer = semver.inc(curVersion, 'minor')
    const {confirmPluginVer} = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmPluginVer',
      message: `Would you like to bump the plugin version from [${pkg.name}@${curVersion}] to [${pkg.name}@${newPluginVer}]?`
    }])

    if (!confirmPluginVer) {
      newPluginVer = await _promptForPluginVersion(curVersion)
    }
  }
  await _checkDependencyVersion(pkg, options.targetDependencies || [])

  //check if flow script is initialized
  if (pkg.scripts && pkg.scripts.flow === undefined) {
    pkg.scripts['flow'] = 'flow'
  }

  //check flow-bin
  if (pkg.devDependencies === undefined) {
    pkg['devDependencies'] = {}
    pkg.devDependencies['flow-bin'] = FLOW_BIN_VERSION
  }
  const isNewVersion = semver.lt(curVersion, newPluginVer)
  if (isNewVersion) {
    pkg.version = newPluginVer
    // should call npm version ${} as it tags and does good stuff.
    fileUtils.writeFile(`${process.cwd()}/${PKG_FILE}`, JSON.stringify(pkg, null, 2)) // Write the new package properties
  }

  if (!fs.existsSync(`${process.cwd()}/${FLOW_CONFIG_FILE}`)) {
    fileUtils.writeFile(`${process.cwd()}/${FLOW_CONFIG_FILE}`, generateFlowConfig())
  }
  const extra = (pkg.ern && pkg.ern.message) || {}
  const config = normalizeConfig({
    name: pkg.name,
    apiVersion: pkg.version,
    apiDescription: pkg.description,
    apiAuthor: pkg.author,
    bridgeVersion: options.bridgeVersion || pkg.peerDependencies['react-native-electrode-bridge'],
    ...extra,
    ...options
  })

  await cleanGenerated()
  await generateSwagger(config, process.cwd())
  log.info('== API generation complete !')

  if (isNewVersion) {
    await publish(pkg)
  } else { log.info('O.K, make sure you bump the version and NPM publish if needed.') }
}
export async function cleanGenerated (outFolder: string = process.cwd()) {
  const pkg = await checkValid(`This is not a properly named API directory. Naming convention is react-native-{name}-api`)

  shell.rm('-rf', path.join(outFolder, 'javascript'))
  shell.rm('-rf', path.join(outFolder, 'swift'))
  shell.rm('-rf', path.join(outFolder, 'android'))
  shell.rm('-rf', path.join(outFolder, 'IOS'))
  return pkg
}

async function checkValid (message: string) {
  const outFolder = process.cwd()

  if (!/react-native-(.*)-api$/.test(outFolder)) {
    throw new Error(message)
  }
  let pkg = await readPackage()
  if (!/react-native-(.*)-api$/.test(pkg.name)) {
    throw new Error(message)
  }
  return pkg
}
async function readPackage () {
  return fileUtils.readJSON(`${process.cwd()}/${PKG_FILE}`)
}
const nextVersion = (curVersion: string, userPluginVer: string) => {
  switch ((userPluginVer + '').toLowerCase()) {
    case 'same':
    case 'no':
    case 'q':
    case 'quit':
    case 'n':
      return curVersion
    default: {
      try {
        // If valid return
        if (semver.valid(userPluginVer) != null) {
          return userPluginVer
        }
        const ret = semver.inc(curVersion, userPluginVer)
        if (ret) {
          return ret
        }
      } catch (e) {
        log.info(`not a valid version:`, userPluginVer)
      }
    }
  }
}
async function _promptForPluginVersion (curVersion: string) {
  const {userPluginVer} = await inquirer.prompt([{
    type: 'input',
    name: 'userPluginVer',
    message: `Current Plugin Version is ${curVersion}. Type the new plugin version (<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | same)?`
  }])
  const ret = nextVersion(curVersion, userPluginVer)
  if (ret == null) {
    log.info(`Sorry, I do not understand your answer`)
    return _promptForPluginVersion(curVersion)
  }
  return ret
}

async function _checkDependencyVersion (pkg: any, targetDependencies: Array<Dependency>) {
  let pluginDependency = pkg.peerDependencies || {}
  let targetNativeDependenciesMap = _constructTargetNativeDependenciesMap(targetDependencies)
  for (const key of Object.keys(pluginDependency)) {
    if (targetNativeDependenciesMap.has(key) && pluginDependency[key] !== targetNativeDependenciesMap.get(key)) {
      const answer = await _promptForMissMatchOfSupportedPlugins(targetNativeDependenciesMap.get(key), key)
      pluginDependency[key] = answer.userPluginVer ? answer.userPluginVer : targetNativeDependenciesMap.get(key)
    }
  }
}

function _constructTargetNativeDependenciesMap (targetDependencies: Array<Dependency>) {
  let targetNativeDependenciesMap = new Map(
    targetDependencies.map((currVal) => {
      const dependencyString = currVal.toString()
      let idx = dependencyString.lastIndexOf('@') // logic for scoped dependency
      return [dependencyString.substring(0, idx), dependencyString.substring(idx + 1)]
    }))
  return targetNativeDependenciesMap
}

function _promptForMissMatchOfSupportedPlugins (curVersion: any, pluginName: string) {
  return inquirer.prompt([{
    type: 'input',
    name: 'userPluginVer',
    message: `Type new plugin version for ${pluginName}. Press Enter to use the default '${curVersion}'.`
  }])
}

async function publish ({version}: { version: string }) {
  const answers = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirmNpmPublish',
    message: `Would you like to NPM publish version [${version}] of this API ?`
  }])
  if (answers.confirmNpmPublish) {
    await npm.npm('publish')
  }
}

exports.default = {
  generateApi,
  regenerateCode,
  cleanGenerated
}
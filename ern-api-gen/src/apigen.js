// @flow

import generateProject, { generateSwagger, generateFlowConfig, generatePackageJson } from './generateProject'
import normalizeConfig from './normalizeConfig'
import fs from 'fs'
import path from 'path'
import semver from 'semver'
import {
  PKG_FILE,
  FLOW_CONFIG_FILE
} from './Constants'
import {
  Dependency,
  fileUtils,
  shell,
  childProcess
} from 'ern-util'
import inquirer from 'inquirer'
const { 
  execp
} = childProcess

/**
 * ==============================================================================
 * Main entry point
 * ==============================================================================
 *
 * Refer to normalizeConfig function doc for the list of options
 */
export async function generateApi (options: Object) {
  let config = normalizeConfig(options)

  const outFolder = path.join(process.cwd(), config.moduleName)
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
 * @param options
 * @returns {Promise.<void>}
 */
export async function regenerateCode (options: Object = {}) {
  const pkg = await validateApiNameAndGetPackageJson(`This is not a properly named API directory. Naming convention is react-native-{name}-api`)
  const curVersion = pkg.version || '0.0.1'
  const pkgName = pkg.name
  let newPluginVer
  if (options.skipVersion) {
    newPluginVer = curVersion
  } else {
    newPluginVer = semver.inc(curVersion, 'minor')
    const {confirmPluginVer} = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmPluginVer',
      message: `Would you like to bump the plugin version from [${pkgName}@${curVersion}] to [${pkgName}@${newPluginVer}]?`
    }])

    if (!confirmPluginVer) {
      newPluginVer = await _promptForPluginVersion(curVersion)
    }
  }
  await _checkDependencyVersion(pkg, options.targetDependencies || [])

  const isNewVersion = semver.lt(curVersion, newPluginVer)
  const extra = (pkg.ern && pkg.ern.message) || {}
  const config = normalizeConfig({
    name: pkgName,
    apiVersion: isNewVersion ? newPluginVer : pkg.version,
    apiDescription: pkg.description,
    apiAuthor: pkg.author,
    bridgeVersion: options.bridgeVersion || pkg.peerDependencies['react-native-electrode-bridge'],
    ...extra,
    ...options
  })

  await cleanGenerated()

  const pkgConfig = {
    npmScope : pkgName && pkgName.startsWith('@') ? pkgName.slice(1, pkgName.indexOf('/')) : '',
    moduleName : pkgName &&  pkgName.startsWith('@') ? pkgName.slice(pkgName.indexOf('/') + 1) : pkgName,
    apiVersion : isNewVersion ? newPluginVer : pkg.version,
    apiDescription : pkg.description,
    apiAuthor : pkg.author,
    bridgeVersion : options.bridgeVersion,
    ...extra
  }
  // Regenerate package.json
  fileUtils.writeFile(path.join(process.cwd(), PKG_FILE), generatePackageJson(pkgConfig))
  // Regenerate .flowconfig file
  fileUtils.writeFile(path.join(process.cwd(), FLOW_CONFIG_FILE), generateFlowConfig())

  await generateSwagger(config, process.cwd())
  log.info('== API generation complete !')

  isNewVersion ? await publish(await readPackage()) : log.info('O.K, make sure you bump the version and NPM publish if needed.')
}

export async function cleanGenerated (outFolder: string = process.cwd()) {
  const pkg = await validateApiNameAndGetPackageJson(`This is not a properly named API directory. Naming convention is react-native-{name}-api`)

  shell.rm('-rf', path.join(outFolder, 'javascript'))
  shell.rm('-rf', path.join(outFolder, 'swift'))
  shell.rm('-rf', path.join(outFolder, 'android'))
  shell.rm('-rf', path.join(outFolder, 'IOS'))
  shell.rm('-rf', path.join(outFolder, FLOW_CONFIG_FILE))
  shell.rm('-rf', path.join(outFolder, PKG_FILE))
  return pkg
}

async function validateApiNameAndGetPackageJson (message: string) {
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
  return fileUtils.readJSON(path.join(process.cwd(), PKG_FILE))
}

const nextVersion = (curVersion: string, userPluginVer: string) => {
  switch (userPluginVer.toLowerCase()) {
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

function _promptForMissMatchOfSupportedPlugins (curVersion: any, pluginName: string) : Promise<string> {
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
    await npmPublish()
  }
}

async function npmPublish() {
  return execp('npm publish')
}

exports.default = {
  generateApi,
  regenerateCode,
  cleanGenerated
}
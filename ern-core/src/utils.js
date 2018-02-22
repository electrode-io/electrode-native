// @flow

import {
  yarn
} from './clients'
import config from './config'
import PackagePath from './PackagePath'
import gitCli from './gitCli'
import http from 'http'
import camelCase from 'lodash/camelCase'
import _ from 'lodash'
import manifest from './Manifest'
import * as ModuleTypes from './ModuleTypes'
import path from 'path'
import fs from 'fs'
import Platform from './Platform'
import CauldronHelper from './CauldronHelper'
import CauldronCli, {
  getCurrentSchemaVersion
} from 'ern-cauldron-api'
import semver from 'semver'

const gitDirectoryRe = /.*\/(.*).git/

export async function isPublishedToNpm (pkg: string | PackagePath): Promise<boolean> {
  if (typeof pkg === 'string') {
    pkg = PackagePath.fromString(pkg)
  }

  let publishedVersionsInfo
  try {
    publishedVersionsInfo = await yarn.info(pkg, {
      field: 'versions',
      json: true
    })
  } catch (e) {
    log.debug(e)
    return false
  }
  if (publishedVersionsInfo) {
    let publishedVersions: Array<string> = publishedVersionsInfo.data
    let type: string = publishedVersionsInfo.type
    if (type && type === 'inspect') {
      const pkgVersion = PackagePath.fromString(pkg.toString()).version
      if (publishedVersions && pkgVersion) {
        return publishedVersions.includes(pkgVersion)
      } else {
        return true
      }
    }
  }
  return false
}

export async function httpGet (url: string): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      resolve(res)
    }).on('error', e => {
      reject(e)
    })
  })
}

/**
 * Camelize name (parameter, property, method, etc)
 *
 * @param word string to be camelize
 * @param lowercaseFirstLetter lower case for first letter if set to true
 * @return camelized string
 */
export function camelize (word: string, lowercaseFirstLetter: boolean = false): string {
  word = camelCase(word)
  return word && word[0][lowercaseFirstLetter ? 'toLowerCase' : 'toUpperCase']() + word.substring(1)
}

/**
 * Split the camel case string
 *
 * @param camelCaseString
 * @returns {string}
 */
export function splitCamelCaseString (camelCaseString: string): Array<string> {
  return camelCaseString.split(/(?=[A-Z])/).map((token) => {
    return token.toLowerCase()
  })
}

export function getDefaultPackageNameForCamelCaseString (moduleName: string, moduleType?: string): string {
  let splitArray = splitCamelCaseString(moduleName)
  switch (moduleType) {
    case ModuleTypes.MINIAPP:
      return _.filter(splitArray, token => !['mini', 'app'].includes(token)).join('-')
    case ModuleTypes.API:
      return _.filter(splitArray, token => !['api'].includes(token)).join('-')
    case ModuleTypes.JS_API_IMPL:
    case ModuleTypes.NATIVE_API_IMPL:
      return _.filter(splitArray, token => !['api', 'impl'].includes(token)).join('-')
    default:
      return splitArray.join('-')
  }
}

export function getDefaultPackageNameForModule (moduleName: string, moduleType: string): string {
  const basePackageName = getDefaultPackageNameForCamelCaseString(moduleName, moduleType)
  switch (moduleType) {
    case ModuleTypes.MINIAPP:
      return basePackageName.concat('-miniapp')
    case ModuleTypes.API:
      return basePackageName.concat('-api')
    case ModuleTypes.JS_API_IMPL:
      return basePackageName.concat('-api-impl-js')
    case ModuleTypes.NATIVE_API_IMPL:
      return basePackageName.concat('-api-impl-native')
    default:
      throw new Error(`Unsupported module type : ${moduleType}`)
  }
}

export async function isDependencyApiOrApiImpl (dependencyName: string): Promise<boolean> {
  const isApi = await isDependencyApi(dependencyName)
  const isApiImpl = !isApi ? await isDependencyApiImpl(dependencyName) : false
  // Note: using constants as using await in return statement was not satisfying standard checks
  return isApi || isApiImpl
}

export async function isDependencyApi (dependencyName: string): Promise<boolean> {
  // for api generated using default name minimize the await time
  if ((/^.*react-native-.+-api$/.test(dependencyName))) {
    return true
  }
  let result
  try {
    const depInfo = await yarn.info(PackagePath.fromString(dependencyName), {field: 'ern 2> /dev/null', json: true})
    result =
      depInfo && depInfo.type === 'error'
        ? false
        : depInfo.data && ModuleTypes.API === depInfo.data.moduleType
  } catch (e) {
    log.debug(e)
    return false
  }
  return result
}

/**
 *
 * @param dependencyName: Name of the dependency
 * @param forceYanInfo: if true, a yarn info command will be executed to determine the api implementation
 * @param type: checks to see if a dependency is of a specific type(js|native) as well
 * @returns {Promise.<boolean>}
 */
export async function isDependencyApiImpl (dependencyName: (string | PackagePath), forceYanInfo?: boolean, type?: ModuleTypes): Promise<boolean> {
  if (dependencyName instanceof PackagePath) {
    dependencyName = dependencyName.toString()
  }
  // for api-impl generated using default name minimize the await time
  if (!type && !forceYanInfo && /^.*react-native-.+-api-impl$/.test(dependencyName)) {
    return true
  }

  const modulesTypes = type ? [type] : [ModuleTypes.NATIVE_API_IMPL, ModuleTypes.JS_API_IMPL]
  let result
  try {
    const depInfo = await yarn.info(PackagePath.fromString(dependencyName), {field: 'ern 2> /dev/null', json: true})
    result =
      depInfo && depInfo.type === 'error'
        ? false
        : depInfo.data && modulesTypes.indexOf(depInfo.data.moduleType) > -1
  } catch (e) {
    log.debug(e)
    return false
  }

  return result
}

export async function isDependencyJsApiImpl (dependency: (string | PackagePath)): Promise<boolean> {
  return isDependencyApiImpl(dependency, true, ModuleTypes.JS_API_IMPL)
}

export async function isDependencyNativeApiImpl (dependency: (string | PackagePath)): Promise<boolean> {
  return isDependencyApiImpl(dependency, true, ModuleTypes.NATIVE_API_IMPL)
}

/**
 * Version of react-native dependency in manifest
 */
export async function reactNativeManifestVersion () {
  const reactNativebasePathDependency = PackagePath.fromString('react-native')
  let reactNativeDependency = await manifest.getNativeDependency(reactNativebasePathDependency)

  if (!reactNativeDependency) {
    throw new Error('Could not retrieve react native dependency from manifest')
  }

  return reactNativeDependency.version
}

export function isValidElectrodeNativeModuleName (name: string): boolean {
  return /^[a-zA-Z]+$/.test(name)
}
/**
 * Download the plugin source given a plugin origin if not already downloaded
 pluginOrigin: A plugin origin object
 Sample plugin origin objects :
 {
  "type": "git",
  "url": "https://github.com/aoriani/ReactNative-StackTracer.git",
  "version": "0.1.1"
 }

 {
  "type": "npm",
  "name": "react-native-code-push",
  "version": "1.16.1-beta"
 }

 Note: The plugin will be downloaded locally to the current directory
 For npm origin it will be put in node_modules directory
 For git origin it will be put directly at the root in a directory named after
 the git repo as one would expect

 Returns:
 * @param pluginOrigin
 * @returns {Promise.<T>} Absolute path to where the plugin was installed
 */
export async function downloadPluginSource (pluginOrigin: any): Promise<string> {
  let downloadPath = getDownloadedPluginPath(pluginOrigin)
  const absolutePluginOutPath = path.join(process.cwd(), downloadPath)

  if (!fs.existsSync(absolutePluginOutPath)) {
    if (pluginOrigin.type === 'npm') {
      const dependency = packagePathFrom(pluginOrigin.name, {scope: pluginOrigin.scope, version: pluginOrigin.version})
      await yarn.add(PackagePath.fromString(dependency.toString()))
    } else if (pluginOrigin.type === 'git') {
      if (pluginOrigin.version) {
        await gitCli().cloneAsync(pluginOrigin.url, {'--branch': pluginOrigin.version})
      }
    } else {
      throw new Error(`Unsupported plugin origin type : ${pluginOrigin.type}`)
    }
  } else {
    log.debug(`Plugin already downloaded to ${absolutePluginOutPath}`)
  }

  return Promise.resolve(absolutePluginOutPath)
}

function packagePathFrom (name, {
  scope,
  version
} : {
  scope?: string,
  version?: string
} = {}) : PackagePath {
  return PackagePath.fromString(`${scope ? `@${scope}/` : ''}${name}${version ? `@${version}` : ''}`)
}

/**
 * Sample plugin origin objects :
 {
  "type": "git",
  "url": "https://github.com/aoriani/ReactNative-StackTracer.git",
  "version": "0.1.1"
 }

 {
  "type": "npm",
  "name": "react-native-code-push",
  "version": "1.16.1-beta"
 }
 * @param pluginOrigin
 */
export function getDownloadedPluginPath (pluginOrigin: any) {
  let downloadPath
  if (pluginOrigin.type === 'npm') {
    if (pluginOrigin.scope) {
      downloadPath = path.join('node_modules', `@${pluginOrigin.scope}`, pluginOrigin.name)
    } else {
      downloadPath = path.join('node_modules', pluginOrigin.name)
    }
  } else if (pluginOrigin.type === 'git') {
    if (pluginOrigin.version) {
      downloadPath = gitDirectoryRe.exec(`${pluginOrigin.url}`)[1]
    }
  }

  if (!downloadPath) {
    throw new Error(`Unsupported plugin origin type : ${pluginOrigin.type}`)
  }
  return downloadPath
}

/**
 * Extracts all the js api implementation dependencies from the plugin array.
 * @param plugins
 * @returns {Promise.<Array.<Dependency>>}
 */
export async function extractJsApiImplementations (plugins: Array<PackagePath>) {
  const jsApiImplDependencies: Array<PackagePath> = []
  for (const dependency of plugins) {
    if (await isDependencyJsApiImpl(dependency)) {
      jsApiImplDependencies.push(dependency)
    }
  }
  return jsApiImplDependencies
}

// Singleton CauldronHelper
// Returns undefined if no Cauldron is active
// Throw error if Cauldron is not using the correct schema version
let currentCauldronHelperInstance
export async function getCauldronInstance ({
    ignoreSchemaVersionMismatch
  } : {
    ignoreSchemaVersionMismatch?: boolean
  } = {}) : Promise<CauldronHelper> {
  if (!currentCauldronHelperInstance) {
    const cauldronRepositories = config.getValue('cauldronRepositories')
    const cauldronRepoInUse = config.getValue('cauldronRepoInUse')
    if (cauldronRepoInUse) {
      const cauldronRepoUrl = cauldronRepositories[cauldronRepoInUse]
      const cauldronRepoBranchReResult = /#(.+)$/.exec(cauldronRepoUrl)
      const cauldronRepoUrlWithoutBranch = cauldronRepoUrl.replace(/#(.+)$/, '')
      const cauldronCli = new CauldronCli(
        cauldronRepoUrlWithoutBranch,
        path.join(Platform.rootDirectory, 'cauldron'),
        cauldronRepoBranchReResult ? cauldronRepoBranchReResult[1] : 'master')
      currentCauldronHelperInstance = new CauldronHelper(cauldronCli)
      const schemaVersionUsedByCauldron = await currentCauldronHelperInstance.getCauldronSchemaVersion()
      const schemaVersionOfCurrentCauldronApi = getCurrentSchemaVersion()
      if (!ignoreSchemaVersionMismatch && (schemaVersionUsedByCauldron !== schemaVersionOfCurrentCauldronApi)) {
        if (semver.gt(schemaVersionUsedByCauldron, schemaVersionOfCurrentCauldronApi)) {
          throw new Error(
`Cauldron schema version mismatch (${schemaVersionUsedByCauldron} > ${schemaVersionOfCurrentCauldronApi}).
You should switch to a newer platform version that supports this Cauldron schema.`
          )
        } else if (semver.lt(schemaVersionUsedByCauldron, schemaVersionOfCurrentCauldronApi)) {
          throw new Error(
`Cauldron schema version mismatch (${schemaVersionUsedByCauldron} < ${schemaVersionOfCurrentCauldronApi}.
You should run the following command : 'ern cauldron upgrade' to upgrade your Cauldron to the latest version.
You can also switch to an older version of the platform which supports this Cauldron schema version.`)
        }
      }
    }
  }
  return Promise.resolve(currentCauldronHelperInstance)
}

export function logErrorAndExitProcess (e: Error, code?: number = 1) {
  log.error(`An error occurred: ${e.message}`)
  log.debug(e.stack)
  process.exit(code)
}

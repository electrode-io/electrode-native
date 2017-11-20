// @flow

import {
  yarn
} from './clients'
import {
  Dependency,
  DependencyPath,
  gitCli
} from 'ern-util'
import * as constants from './constants'
import config from './config'
import http from 'http'
import camelCase from 'lodash/camelCase'
import _ from 'lodash'
import manifest from './Manifest'
import * as ModuleTypes from './ModuleTypes'
import path from 'path'
import fs from 'fs'

const gitDirectoryRe = /.*\/(.*).git/

export async function isPublishedToNpm (pkg: string | DependencyPath): Promise<boolean> {
  if (typeof pkg === 'string') {
    pkg = DependencyPath.fromString(pkg)
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
      const pkgVersion: string = Dependency.fromString(pkg.toString()).version
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

export function getDefaultPackageNameForCamelCaseString (moduleName: string, moduleType: string): string {
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
  const depInfo = await yarn.info(DependencyPath.fromString(dependencyName), {field: 'ern 2> /dev/null', json: true})
  const result =
    depInfo && depInfo.type === 'error'
      ? false
      : depInfo.data && ModuleTypes.API === depInfo.data.moduleType
  return result
}

export async function isDependencyApiImpl (dependencyName: string): Promise<boolean> {
  // for api-impl generated using default name minimize the await time
  if (/^.*react-native-.+-api-impl$/.test(dependencyName)) {
    return true
  }
  const depInfo = await yarn.info(DependencyPath.fromString(dependencyName), {field: 'ern 2> /dev/null', json: true})
  const result =
    depInfo && depInfo.type === 'error'
      ? false
      : depInfo.data && [`${ModuleTypes.NATIVE_API_IMPL}`, `${ModuleTypes.JS_API_IMPL}`].indexOf(depInfo.data.moduleType) > -1
  return result
}

/**
 * Version of react-native dependency in manifest
 */
export async function reactNativeManifestVersion () {
  const reactNativeVersionLessDependency = Dependency.fromString('react-native')
  let reactNativeDependency = await manifest.getNativeDependency(reactNativeVersionLessDependency)

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
      const dependency = new Dependency(pluginOrigin.name, {scope: pluginOrigin.scope, version: pluginOrigin.version})
      await yarn.add(DependencyPath.fromString(dependency.toString()))
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

export function updateDeviceConfig (platform: 'ios' | 'android', usePreviousDevice: boolean = false) {
  const key = platform === 'ios' ? constants.IOS_DEVICE_CONFIG : constants.ANDROID_DEVICE_CONFIG

  let deviceConfig = config.getValue(key, {
    deviceId: ''
  })
  deviceConfig.usePreviousDevice = usePreviousDevice
  config.setValue(key, deviceConfig)
}

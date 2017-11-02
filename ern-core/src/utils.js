// @flow

import {
  yarn
} from './clients'
import {
  Dependency,
  DependencyPath,
  gitCli
} from 'ern-util'
import http from 'http'
import camelCase from 'lodash/camelCase'
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

  let publishedVersions: Array<string> = publishedVersionsInfo.data
  const pkgVersion: string = Dependency.fromString(pkg.toString()).version
  if (publishedVersions && pkgVersion) {
    return publishedVersions.includes(pkgVersion)
  } else {
    return true
  }
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
export function splitCamelCaseString (camelCaseString: string) : Array<string> {
  return camelCaseString.split(/(?=[A-Z])/).map((token) => {
    return token.toLowerCase()
  })
}

export function getDefaultPackageNameForCamelCaseString (camelCaseString: string) {
  return splitCamelCaseString(camelCaseString).join('-')
}

export function getDefaultPackageNameForModule (moduleName: string, moduleType: string) {
  const basePackageName = getDefaultPackageNameForCamelCaseString(moduleName)
  switch (moduleType) {
    case ModuleTypes.MINIAPP:
      return basePackageName.concat('-miniapp')
    case ModuleTypes.API:
      return basePackageName.concat('-api')
    case ModuleTypes.JS_API_IMPL:
      return basePackageName.concat('-js-api-impl')
    case ModuleTypes.NATIVE_API_IMPL:
      return basePackageName.concat('-native-api-impl')
    default:
      throw new Error(`Unsupported module type : ${moduleType}`)
  }
}

export function isDependencyApiOrApiImpl (dependencyName: string): boolean {
  return (isDependencyApi(dependencyName) || isDependencyApiImpl(dependencyName))
}

export function isDependencyApi (dependencyName: string): boolean {
  return (/^.*react-native-.+-api$/.test(dependencyName))
}

export function isDependencyApiImpl (dependencyName: string): boolean {
  return (/^.*react-native-.+-api-impl$/.test(dependencyName))
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

export function isValidElectrodeNativeModuleName (name: string) : boolean {
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
function getDownloadedPluginPath (pluginOrigin: any) {
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

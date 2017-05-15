import Boom from 'boom'
import crypto from 'crypto'
import {some as _some} from 'lodash'

//====================================
// Cauldron Helper
//====================================
export const shasum = (payload) => crypto.createHash('sha1').update(payload).digest('hex')

export function alreadyExists(collection, name, version) {
  if (!version) {
    return _some(collection, x => x.name === name)
  } else {
    return _some(collection, x => (x.name === name) && (x.version === version))
  }
}

export function buildNativeBinaryFileName(appName, platformName, versionName) {
  const ext = getNativeBinaryFileExt(platformName)
  return `${appName}-${platformName}@${versionName}.${ext}`
}

export function getNativeBinaryFileExt(platformName) {
  return platformName === 'android' ? 'apk' : 'app'
}

export function buildReactNativeSourceMapFileName(appName, versionName) {
  return `${appName}@${versionName}.map`
}

export function checkNotFound(val, message, ...data) {
  if (val == null)
  throw new Boom.notFound(message, data)
  return val
}

//
// Removes the version from a dependency string and return the new string
// Sample inputs => outputs :
// react-native@0.42.0 => react-native
// @walmart/react-something@1.0.0 => @walmart/react-something
export function removeVersionFromDependency(dependency) {
  return /^(@?.+)@.+$/.exec(dependency)[1]
}

//
// Check if a dependency is present in a given array of dependencies
// nativeDependencies : An array containing the native dependencies as strings
//   Sample : [ "@walmart/react-native-electrode-bridge@1.0.0" , "react-native@0.42.0" ]
//
// dependency : A dependency string 
//   Sample : "react-native@0.42.0"
//
// shouldMatchVersion : if set to true, the version of the dependency has to match
//                      for it to be considered present.
export function containsDependency(nativeDependencies, dependency, {
  shouldMatchVersion
} = {}) {
  if (!shouldMatchVersion) {
    dependency = `${removeVersionFromDependency(dependency)}@`
  }
  
  return _some(nativeDependencies, d => d.startsWith(dependency))
}
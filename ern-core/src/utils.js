// @flow

import {
  yarn
} from './clients'
import {
  Dependency,
  DependencyPath
} from 'ern-util'
import http from 'http'
import camelCase from 'lodash/camelCase'

export async function isPublishedToNpm (pkg: string | DependencyPath) : Promise<boolean> {
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
  return publishedVersions.includes(Dependency.fromString(pkg.toString()).version)
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
export function splitCamelCaseString (camelCaseString: string) {
  return camelCaseString && camelCaseString.split(/(?=[A-Z])/).map((token) => {
    return token.toLowerCase()
  })
}

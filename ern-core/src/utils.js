// @flow

import {
  yarn
} from './clients'
import {
  Dependency,
  DependencyPath
} from 'ern-util'
import http from 'http'

export async function isPublishedToNpm (pkg: string | DependencyPath) : Promise<boolean> {
  if (pkg instanceof DependencyPath || typeof pkg === 'string') {
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
  return publishedVersions.includes(Dependency.fromString(pkg).version)
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

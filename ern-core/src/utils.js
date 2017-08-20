// @flow

import {
  yarn
} from './clients'
import {
  Dependency,
  DependencyPath
} from 'ern-util'

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

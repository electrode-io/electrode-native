// @flow

import {
  yarn
} from './clients'
import {
  DependencyPath
} from 'ern-util'

export async function isPublishedToNpm (pkg: string | DependencyPath) : Promise<boolean> {
  if (pkg instanceof DependencyPath || typeof pkg === 'string') {
    pkg = DependencyPath.fromString(pkg)
  }

  let publishedVersionsInfo
  try {
    publishedVersionsInfo = await yarn.info(DependencyPath.fromString(`${this.packageJson.name}@${this.packageJson.version}`), {
      field: 'versions',
      json: true
    })
  } catch (e) {
    log.debug(e)
    return false
  }
  let publishedVersions: Array<string> = publishedVersionsInfo.data
  return publishedVersions.includes(this.packageJson.version)
}

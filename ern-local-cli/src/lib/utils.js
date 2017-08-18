// @flow

import {
  cauldron
} from 'ern-core'
import _ from 'lodash'

async function getNapDescriptorStringsFromCauldron ({
  platform,
  onlyReleasedVersions
} : {
  platform?: 'ios' | 'android',
  onlyReleasedVersions?: boolean
} = {}) {
  const nativeApps = await cauldron.getAllNativeApps()
  return _.filter(
            _.flattenDeep(
              _.map(nativeApps, nativeApp =>
                _.map(nativeApp.platforms, p =>
                _.map(p.versions, version => {
                  if (!platform || platform === p.name) {
                    if (!onlyReleasedVersions || version.isReleased) {
                      return `${nativeApp.name}:${p.name}:${version.name}`
                    }
                  }
                })))), elt => elt !== undefined)
}

export default {
  getNapDescriptorStringsFromCauldron
}

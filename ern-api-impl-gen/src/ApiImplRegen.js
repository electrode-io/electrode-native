// @flow

import ApiImplGen from './generators/ApiImplGen'
import { PackagePath } from 'ern-core'

export default async function regenerateApiImpl
  ({
     api,
     paths,
     reactNativeVersion,
     platforms
   }: {
    api: PackagePath,
    paths: Object,
    reactNativeVersion: string,
    platforms: Array<string>
  }) {
  try {
    log.debug(`Entering regenerateApiImpl ${JSON.stringify(arguments[0])}`)
    await new ApiImplGen().generateApiImplementation(api, paths, reactNativeVersion, platforms, true)
  } catch (e) {
    throw e
  }
}

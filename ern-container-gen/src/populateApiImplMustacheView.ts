import { log, ModuleTypes, utils, readPackageJsonSync } from 'ern-core'
import fs from 'fs'
import path from 'path'

/**
 *
 * @param apiImplPluginPath : node package directory from for the api impl module.
 * @param mustacheView: Object
 * @param excludeJsImpl: setting this to true will exclude api details for a JS implementation.
 * @param excludeNativeImpl: setting this to true will exclude api details for a native implementation.
 */
export function populateApiImplMustacheView(
  apiImplPluginPath: string,
  mustacheView: any = {},
  excludeJsImpl?: boolean,
  excludeNativeImpl?: boolean
) {
  const packageJson = readPackageJsonSync(apiImplPluginPath)
  const containerGenConfig = packageJson.ern.containerGen
  if (containerGenConfig && containerGenConfig.apiNames) {
    mustacheView.apiImplementations = mustacheView.apiImplementations
      ? mustacheView.apiImplementations
      : []
    for (const apiName of containerGenConfig.apiNames) {
      if (
        excludeJsImpl &&
        packageJson.ern.moduleType === ModuleTypes.JS_API_IMPL
      ) {
        continue
      }
      if (
        excludeNativeImpl &&
        packageJson.ern.moduleType === ModuleTypes.NATIVE_API_IMPL
      ) {
        continue
      }
      const api = {
        apiName,
        apiVariableName: utils.camelize(apiName, true),
        hasConfig: containerGenConfig.hasConfig,
      }
      mustacheView.apiImplementations.push(api)
    }
  } else {
    log.warn(
      `!!!!! containerGen entry not valid for api implementation, skipping api-impl code gen in container for ${
        packageJson.name
      } !!!!`
    )
  }
}

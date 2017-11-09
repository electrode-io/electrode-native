import {
  utils
} from 'ern-core'
import fs from 'fs'
import path from 'path'

/**
 *
 * @param apiImplPluginPath : node package directory from for the api impl module.
 * @param mustacheView: Object
 */
export default function populateApiImplMustacheView (apiImplPluginPath: string, mustacheView?: Object = {}) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(apiImplPluginPath, 'package.json'), 'utf-8'))
  const containerGenConfig = packageJson.ern.containerGen
  if (containerGenConfig && containerGenConfig.apiNames) {
    mustacheView.apiImplementations = mustacheView.apiImplementations ? mustacheView.apiImplementations : []
    for (const apiName of containerGenConfig.apiNames) {
      let api = {
        apiName,
        hasConfig: containerGenConfig.hasConfig,
        apiVariableName: utils.camelize(apiName, true)
      }
      mustacheView.apiImplementations.push(api)
    }
  } else {
    log.warn(`!!!!! containerGen entry not valid for api implementation, skipping api-impl code gen in container for ${packageJson.name} !!!!`)
  }
}

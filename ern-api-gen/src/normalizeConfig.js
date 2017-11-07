// @flow

import {
  Dependency
} from 'ern-util'
import {
  MODEL_FILE
} from './Constants'
import path from 'path'
const cwd = path.join.bind(path, process.cwd())

// Generate a configuration. This looks in the apigen schema
// and the things passed in.
const isApiRe = /.*react-native-(.*)-api$/

//
// Options :
// - name : Name of the api [REQUIRED]
// - bridgeVersion : The version of the bridge to use to generate API [REQUIRED]
// - reactNativeVersion : Version of react native to use [REQUIRED]
// - apiVersion : Version of the api [default: 1.0.0]
// - apiDescription : Description of the API [default: ERN Generated API for {name}]
// - apiAuthor : Author of the API [Default: EMAIL or USER env variable]
// - namespace : Namespace to use for messages [Default: com.{npmscope}.{name}.ern]
// - npmScope: Npm scope to use for the module [Default: no scope]
// - modelsSchemaPath : Path to the file holding the models schema [Default : no path]
// - apiSchemaPath : Path to the file holding the api schema [Default : no path]
// - moduleName : Name of the generated npm module
// - shouldGenerateBlankApi : Indicated whether to generate blank api/model schema or sample one [Default : false]
// - packageName : npm package name of the moduleName
export default function normalizeConfig ({
  name, /* REQUIRED */
  bridgeVersion, /* REQUIRED */
  reactNativeVersion, /* REQUIRED */
  targetDependencies, /* REQUIRED */
  apiVersion,
  apiDescription,
  apiAuthor,
  namespace,
  npmScope,
  apiSchemaPath = MODEL_FILE,
  moduleName,
  artifactId,
  shouldGenerateBlankApi,
  packageName,
  ...rest
} : {
  name: string,
  bridgeVersion: string,
  reactNativeVersion: string,
  targetDependencies: Array<Dependency>,
  apiVersion?: string,
  apiDescription?: string,
  apiAuthor?: string,
  namespace?: string,
  npmScope?: string,
  apiSchemaPath?: string,
  moduleName?: string,
  artifactId?: string,
  shouldGenerateBlankApi?: boolean,
  packageName: string,
  rest?: any
}) {
  let simpleName = name

  if (isApiRe.test(name)) {
    simpleName = isApiRe.exec(name).pop()
  }

  let config = {}

  if (simpleName) {
    if (/^@/.test(simpleName)) {
      const [, _pkgName, _name] = /^@(.+?)\/(?:react-native-)?(.+?)(?:-api)?$/.exec(simpleName)
      simpleName = _name
      if (!namespace) {
        namespace = _pkgName ? `com.${_pkgName}.${simpleName}` : simpleName
      }
    }
    config.moduleName = simpleName
  }
  if (namespace) {
    config.namespace = namespace
  }
  if (!config.namespace) {
    config.namespace = npmScope ? `com.${npmScope}.${simpleName}.ern` : `com.${simpleName}.ern`
  }
  if (apiVersion) {
    config.apiVersion = apiVersion
  }
  if (apiDescription) {
    config.apiDescription = apiDescription
  }
  if (npmScope) {
    config.npmScope = npmScope
  }
  if (!config.moduleName) {
    config.moduleName = moduleName || simpleName
  }
  if (!config.apiAuthor) {
    config.apiAuthor = apiAuthor || process.env['EMAIL'] || process.env['USER']
  }
  if (!config.apiVersion) {
    config.apiVersion = '1.0.0'
  }
  if (!config.apiDescription) {
    config.apiDescription = `ERN Generated API for ${config.moduleName}`
  }
  if (bridgeVersion) {
    config.bridgeVersion = bridgeVersion
  }
  if (reactNativeVersion) {
    config.reactNativeVersion = reactNativeVersion
  }
  if (shouldGenerateBlankApi) {
    config.shouldGenerateBlankApi = shouldGenerateBlankApi
  }
  if (apiSchemaPath) {
    config.apiSchemaPath = apiSchemaPath
  }
  if (!config.artifactId) {
    config.artifactId = `react-native-${simpleName}-api`
  }
  if (targetDependencies) {
    config.targetDependencies = targetDependencies
  }

  if (packageName) {
    config.packageName = packageName
  }
  return config
}

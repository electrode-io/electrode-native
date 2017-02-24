import cwd from './cwd';
import parseApiSchema from './parseApiSchema';
import fs from 'fs';
import { SCHEMA_FILE, MODEL_FILE, CONFIG_FILE } from './Constants';

function generateConfigFromSchemaSync(file) {
    return parseApiSchema(fs.readFileSync(file, 'utf8'), file);
}

// Generate a configuration. This looks in the apigen schema
// and the things passed in.
const isApiRe = /.*react-native-(.*)-api$/;
const isNameRe = /^(?:([^@]*)@)?(.*)$/;

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
// - moduleName : Name of the generated npm module [Default : react-native-{name}-api]
// - shouldGenerateBlankApi : Indicated whether to generate blank api/model schema or sample one [Default : false]
// - configFilePath : Path to configuration file [Default : no path]
export default function normalizeConfig({
  name, /* REQUIRED */
  bridgeVersion, /* REQUIRED */
  reactNativeVersion, /* REQUIRED */
  apiVersion,
  apiDescripion,
  apiAuthor,
  namespace,
  npmScope,
  modelsSchemaPath = MODEL_FILE,
  apiSchemaPath = SCHEMA_FILE,
  moduleName,
  shouldGenerateBlankApi,
  configFilePath = cwd(CONFIG_FILE)
}) {
  let simpleName = name;

  if (isApiRe.test(name)) {
    simpleName = isApiRe.exec(name).pop();
  }

  let config = {};

  if (fs.existsSync(apiSchemaPath)) {
    Object.assign(config, generateConfigFromSchemaSync(apiSchemaPath));
  } else if (fs.existsSync(configFilePath)) {
    Object.assign(JSON.parse(fs.readFileSync(configFilePath, 'utf-8')));
  }
  if (simpleName) {
    config.apiName = simpleName;
  }
  if (namespace) {
    config.namespace = namespace;
  }
  if (!config.namespace) {
    config.namespace = npmScope ? `com.${npmScope}.${simpleName}.ern` : `com.${simpleName}.ern`
  }
  if (apiVersion) {
    config.apiVersion = apiVersion;
  }
  if (apiDescripion) {
    config.apiDescripion = apiDescripion;
  }
  if (npmScope) {
    config.npmScope = npmScope;
  }
  if (!config.moduleName) {
    config.moduleName = moduleName || `react-native-${simpleName}-api`;
  }
  if (!config.apiAuthor) {
    config.apiAuthor = apiAuthor || process.env['EMAIL'] || process.env['USER']
  }
  if (!config.apiVersion) {
    config.apiVersion = '1.0.0';
  }
  if (!config.apiDescripion) {
    config.apiDescripion = `ERN Generated API for ${config.apiName}`;
  }
  if (modelsSchemaPath) {
    config.modelsSchemaPath = modelsSchemaPath;
  }
  if (bridgeVersion) {
    config.bridgeVersion = bridgeVersion;
  }
  if (reactNativeVersion) {
    config.reactNativeVersion = reactNativeVersion;
  }
  if (shouldGenerateBlankApi) {
    config.shouldGenerateBlankApi = shouldGenerateBlankApi;
  }
  if (apiSchemaPath) {
    config.apiSchemaPath = apiSchemaPath;
  }
  return config;
}

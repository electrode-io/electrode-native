import fs from 'fs';
import {MODEL_FILE, CONFIG_FILE} from './Constants';
import path from 'path';
const cwd = path.join.bind(path, process.cwd());

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
    apiDescription,
    apiAuthor,
    namespace,
    npmScope,
    apiSchemaPath = MODEL_FILE,
    moduleName,
    artifactId,
    shouldGenerateBlankApi,
    configFilePath = cwd(CONFIG_FILE),
    ...rest
}) {
    let simpleName = name;

    if (isApiRe.test(name)) {
        simpleName = isApiRe.exec(name).pop();
    }

    let config = {};

    if (fs.existsSync(configFilePath)) {
        Object.assign(config, JSON.parse(fs.readFileSync(configFilePath, 'utf-8')));
    }

    if (simpleName) {
        if (/^@/.test(simpleName)) {
            const [, _pkgName, _name] = /^@(.+?)\/(?:react-native-)?(.+?)(?:-api)?$/.exec(simpleName);
            simpleName = _name;
            if (!namespace) {
                namespace = _pkgName ? `com.${_pkgName}.${simpleName}` : simpleName;
            }
        }
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
    if (apiDescription) {
        config.apiDescription = apiDescription;
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
    if (!config.apiDescription) {
        config.apiDescription = `ERN Generated API for ${config.apiName}`;
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
    if (!artifactId) {
        config.artifactId = config.moduleName;
    }
    return config;
}

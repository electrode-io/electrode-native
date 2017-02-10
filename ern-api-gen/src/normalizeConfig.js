import cwd from './cwd';
import parseApiSchema from './parseApiSchema';
import fs from 'fs';
import {SCHEMA_FILE, CONFIG_FILE} from './Constants';

function generateConfigFromSchemaSync(file) {
    return parseApiSchema(fs.readFileSync(file, 'utf8'));
}

//generate a configuration.  This looks in the apigen schema
// and the things passed in.
const isApiRe = /.*react-native-(.*)-api$/;
const isNameRe = /^(?:([^@]*)@)?(.*)$/;

export default function normalizeConfig({
    name,
    apiName,
    apiVersion,
    apiDescripion,
    apiAuthor,
    namespace,
    npmScope,
    bridgeVersion,
    modelsSchemaPath,
    moduleName,
    reactNativeVersion,
    schemaFilePath = cwd(SCHEMA_FILE),
    configFilePath = cwd(CONFIG_FILE),

}) {
    let simpleName = name;

    if (isApiRe.test(name)) {
        simpleName = isApiRe.exec(name).pop();
    }

    let config = {};
    if (isNameRe.test(apiName)) {
        const [all, nScope, nName] = isNameRe.exec(name);
        if (!apiName) apiName = nName;
        if (!npmScope) npmScope = nScope;
    }

    if (fs.existsSync(schemaFilePath)) {
        Object.assign(config, generateConfigFromSchemaSync(schemaFilePath));
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
    return config;
}


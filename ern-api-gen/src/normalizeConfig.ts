import { PackagePath } from 'ern-core';

// Generate a configuration. This looks in the apigen schema
// and the things passed in.
//
// Options :
// - name : Name of the api [REQUIRED]
// - bridgeVersion : The version of the bridge to use to generate API [REQUIRED]
// - reactNativeVersion : Version of react native to use [REQUIRED]
// - targetDependencies : List of target dependencies [default: empty]
// - apiVersion : Version of the api [default: 1.0.0]
// - apiDescription : Description of the API [default: ERN Generated API for {name}]
// - apiAuthor : Author of the API [Default: EMAIL or USER env variable]
// - namespace : Namespace to use for messages [Default: com.{npmscope}.{name}.ern]
// - npmScope: Npm scope to use for the module [Default: no scope]
// - apiSchemaPath : Path to the file holding the api schema [Default: schema.json]
// - moduleName : Name of the generated module
// - artifactId : The artifact id
// - packageName : npm package name of the module
export default function normalizeConfig({
  name /* REQUIRED */,
  bridgeVersion /* REQUIRED */,
  reactNativeVersion /* REQUIRED */,
  targetDependencies,
  apiVersion,
  apiDescription,
  apiAuthor,
  namespace,
  npmScope,
  apiSchemaPath = 'schema.json',
  moduleName,
  artifactId,
  packageName,
  ...rest
}: {
  name: string;
  bridgeVersion: string;
  reactNativeVersion: string;
  targetDependencies?: PackagePath[];
  apiVersion?: string;
  apiDescription?: string;
  apiAuthor?: string;
  namespace?: string;
  npmScope?: string;
  apiSchemaPath?: string;
  moduleName?: string;
  artifactId?: string;
  packageName?: string;
  rest?: any;
}) {
  const config: any = {};

  let simpleName = name.toLowerCase();
  let scope;
  const results = /^@(.+?)\/(?:react-native-)?(.+?)(?:-api)?$/.exec(simpleName);
  if (results) {
    scope = results![1];
    simpleName = results![2];
  }
  simpleName = simpleName.replace(/^react-native-|-api$|[^a-z0-9]/g, '');
  if (npmScope) {
    config.npmScope = npmScope;
  } else if (scope) {
    config.npmScope = scope;
  }
  config.namespace = namespace
    ? namespace
    : config.npmScope
    ? `com.${config.npmScope}.${simpleName}.ern`
    : `com.${simpleName}.ern`;
  config.moduleName = moduleName || simpleName;
  config.apiAuthor = apiAuthor || process.env.EMAIL || process.env.USER;
  config.apiVersion = apiVersion || '1.0.0';
  config.apiDescription =
    apiDescription || `ERN Generated API for ${config.moduleName}`;
  if (bridgeVersion) {
    config.bridgeVersion = bridgeVersion;
  }
  if (reactNativeVersion) {
    config.reactNativeVersion = reactNativeVersion;
  }
  if (apiSchemaPath) {
    config.apiSchemaPath = apiSchemaPath;
  }
  config.artifactId = artifactId || `react-native-${simpleName}-api`;
  if (targetDependencies) {
    config.targetDependencies = targetDependencies;
  }
  if (packageName) {
    config.packageName = packageName;
  }
  return config;
}

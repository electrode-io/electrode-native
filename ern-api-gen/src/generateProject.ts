import path from 'path';
import fs from 'fs-extra';
import { ModuleTypes } from 'ern-core';
import { CodegenConfigurator, DefaultGenerator } from './index';
import {
  FLOW_BIN_VERSION,
  FLOW_CONFIG_FILE,
  INITIAL_SCHEMA_FILE,
  MODEL_FILE,
  PKG_FILE,
} from './Constants';

export const GENERATE = [
  ['android', 'ERNAndroid'],
  ['javascript', 'ERNES6'],
  ['IOS', 'ERNSwift'],
];

export async function generateSwagger(
  { apiSchemaPath = MODEL_FILE, name, namespace = '', ...optional },
  outFolder: string,
) {
  const inputSpec = path.resolve(outFolder, apiSchemaPath);
  const groupId = namespace.toLowerCase().replace(/[^a-z0-9._]/g, '');
  const shared = {
    apiPackage: `${groupId}.api`,
    description: optional.apiDescription,
    groupId,
    inputSpec,
    modelPackage: `${groupId}.model`,
    projectVersion: optional.apiVersion,
    version: optional.apiVersion,
    ...optional,
  };

  for (const [projectName, lang] of GENERATE) {
    const cc = new CodegenConfigurator({
      ...shared,
      lang,
      outputDir: outFolder + '/' + projectName,
      projectName,
    });
    const opts = await cc.toClientOptInput();
    new DefaultGenerator().opts(opts).generate();
  }
}

export function generatePackageJson({
  npmScope,
  reactNativeVersion,
  apiVersion,
  apiDescription,
  apiAuthor,
  apiLicense,
  bridgeVersion,
  packageName,
  ...conf
}: {
  npmScope?: string;
  reactNativeVersion?: string;
  apiVersion?: string;
  apiDescription?: string;
  apiAuthor?: string;
  apiLicense?: string;
  bridgeVersion?: string;
  packageName: string;
  config?: any;
}) {
  // Reset the apiSchemaPath to schema.json
  // if --schemaPath option is used to create the Api
  const options = { ...conf, apiSchemaPath: MODEL_FILE };
  const dependencies = bridgeVersion
    ? {
        'react-native-electrode-bridge': `${bridgeVersion.split('.')[0]}.${
          bridgeVersion.split('.')[1]
        }.x`,
      }
    : undefined;
  // tslint:disable:object-literal-sort-keys
  return JSON.stringify(
    {
      name: npmScope ? `@${npmScope}/${packageName}` : packageName,
      version: apiVersion ?? '1.0.0',
      description: apiDescription,
      main: 'javascript/src/index.d.ts',
      scripts: {
        flow: 'flow',
      },
      keywords: [`${ModuleTypes.API}`],
      author: apiAuthor,
      license: apiLicense,
      dependencies,
      devDependencies: {
        'flow-bin': FLOW_BIN_VERSION,
      },
      ern: {
        message: options,
        moduleType: `${ModuleTypes.API}`,
      },
    },
    null,
    2,
  ).concat('\n');
}

export async function generateInitialSchema({
  apiSchemaPath,
}: {
  apiSchemaPath: string;
}) {
  const pathToSchemaFile =
    apiSchemaPath && fs.existsSync(apiSchemaPath)
      ? apiSchemaPath
      : path.join(__dirname, '..', INITIAL_SCHEMA_FILE);
  return fs.readFile(pathToSchemaFile);
}

export function generateFlowConfig(): string {
  return `[ignore]

[include]

[libs]

[lints]

[options]
`;
}

export default async function generateProject(
  config: any = {},
  outFolder: string,
) {
  await fs.writeFile(
    path.join(outFolder, PKG_FILE),
    generatePackageJson(config),
  );
  await fs.writeFile(
    path.join(outFolder, MODEL_FILE),
    await generateInitialSchema(config),
  );
  await fs.writeFile(
    path.join(outFolder, FLOW_CONFIG_FILE),
    generateFlowConfig(),
  );
  await generateSwagger(config, outFolder);
}

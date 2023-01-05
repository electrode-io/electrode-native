import path from 'path';
import fs from 'fs-extra';
import { ModuleTypes } from 'ern-core';
import { CodegenConfigurator, DefaultGenerator } from './index';

export const GENERATE = [
  ['android', 'ERNAndroid'],
  ['ios', 'ERNSwift'],
  ['javascript', 'ERNES6'],
];

export async function generateSwagger(
  { apiSchemaPath = 'schema.json', name, namespace = '', ...optional },
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
  const options = { ...conf, apiSchemaPath: 'schema.json' };
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
      main: 'javascript/src/index.js',
      keywords: [`${ModuleTypes.API}`],
      author: apiAuthor,
      license: apiLicense,
      dependencies,
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
      : path.join(__dirname, '..', 'initialApiSchema.json');
  return fs.readFile(pathToSchemaFile);
}

export function generateGitignore(): string {
  return `.DS_Store
.idea/
node_modules/
`;
}

export default async function generateProject(
  config: any = {},
  outFolder: string,
) {
  await fs.writeFile(path.join(outFolder, '.gitignore'), generateGitignore());
  await fs.writeFile(
    path.join(outFolder, 'package.json'),
    generatePackageJson(config),
  );
  await fs.writeFile(
    path.join(outFolder, 'schema.json'),
    await generateInitialSchema(config),
  );
  await generateSwagger(config, outFolder);
}

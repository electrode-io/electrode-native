import path from 'path'
import fs from 'fs'
import { fileUtils, ModuleTypes, log } from 'ern-core'
import { CodegenConfigurator, DefaultGenerator } from './index'
import {
  PKG_FILE,
  MODEL_FILE,
  FLOW_CONFIG_FILE,
  FLOW_BIN_VERSION,
  INITIAL_SCHEMA_FILE,
} from './Constants'

export const GENERATE = [
  ['android', 'ERNAndroid'],
  ['javascript', 'ERNES6'],
  ['IOS', 'ERNSwift'],
]

export async function generateSwagger(
  { apiSchemaPath = MODEL_FILE, name, namespace = '', ...optional },
  outFolder: string
) {
  const inputSpec = path.resolve(outFolder, apiSchemaPath)
  const shared = {
    apiPackage: `${namespace}.api`,
    description: optional.apiDescription,
    groupId: namespace,
    inputSpec,
    modelPackage: `${namespace}.model`,
    projectVersion: optional.apiVersion,
    version: optional.apiVersion,
    ...optional,
  }

  for (const [projectName, lang] of GENERATE) {
    const cc = new CodegenConfigurator({
      ...shared,
      lang,
      outputDir: outFolder + '/' + projectName,
      projectName,
    })
    const opts = await cc.toClientOptInput()
    new DefaultGenerator().opts(opts).generate()
  }
}
export function generatePackageJson({
  npmScope,
  reactNativeVersion,
  apiVersion = '1.0.0',
  apiDescription,
  apiAuthor,
  apiLicense,
  bridgeVersion = '',
  packageName,
  ...conf
}: {
  npmScope?: string
  reactNativeVersion?: string
  apiVersion?: string
  apiDescription?: string
  apiAuthor?: string
  apiLicense?: string
  bridgeVersion?: string
  packageName?: string
  config?: any
}) {
  // Reset the apiSchemaPath to schema.json
  // if --schemaPath option is used to create the Api
  const options = { ...conf, apiSchemaPath: MODEL_FILE }
  return JSON.stringify(
    {
      author: apiAuthor,
      dependencies: {
        'react-native-electrode-bridge': `${bridgeVersion.split('.')[0]}.${
          bridgeVersion.split('.')[1]
        }.x`,
      },
      description: apiDescription,
      devDependencies: {
        'flow-bin': FLOW_BIN_VERSION,
      },
      ern: {
        message: options,
        moduleType: `${ModuleTypes.API}`,
      },
      keywords: [`${ModuleTypes.API}`],
      license: apiLicense,
      main: 'javascript/src/index.js',
      name: npmScope ? `@${npmScope}/${packageName}` : packageName,
      scripts: {
        flow: 'flow',
      },
      version: apiVersion,
    },
    null,
    2
  )
}

export async function generateInitialSchema({
  namespace,
  apiSchemaPath,
}: {
  namespace?: string
  apiSchemaPath: string
}) {
  const pathToSchemaFile =
    apiSchemaPath && fs.existsSync(apiSchemaPath)
      ? apiSchemaPath
      : path.join(__dirname, '..', INITIAL_SCHEMA_FILE)
  return fileUtils.readFile(pathToSchemaFile)
}

export function generateFlowConfig(): string {
  return `[ignore]

[include]

[libs]

[lints]

[options]
`
}

export default async function generateProject(
  config: any = {},
  outFolder: string
) {
  await fileUtils.writeFile(
    path.join(outFolder, PKG_FILE),
    generatePackageJson(config)
  )
  await fileUtils.writeFile(
    path.join(outFolder, MODEL_FILE),
    await generateInitialSchema(config)
  )
  await fileUtils.writeFile(
    path.join(outFolder, FLOW_CONFIG_FILE),
    generateFlowConfig()
  )
  await generateSwagger(config, outFolder)
}

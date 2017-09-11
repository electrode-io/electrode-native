// @flow

import path from 'path'
import {
  fileUtils
} from 'ern-util'

import {
  CodegenConfigurator,
  DefaultGenerator
} from './index'

import {
  PKG_FILE,
  MODEL_FILE,
  FLOW_CONFIG_FILE,
  FLOW_BIN_VERSION
} from './Constants'
import {
  ModuleTypes
} from 'ern-core'

export const GENERATE = [['android', 'ERNAndroid'], ['javascript', 'ERNES6'], ['IOS', 'ERNSwift']]

export async function generateSwagger ({
    apiSchemaPath = MODEL_FILE,
    name,
    namespace = '',
    ...optional
  } : {
    apiSchemaPath?: string,
    name?: string,
    namespace?: string,
    optional?: any
  }, outFolder: string) {
  const inputSpec = path.resolve(outFolder, apiSchemaPath)
  const shared = {
    apiPackage: `${namespace}.api`,
    modelPackage: `${namespace}.model`,
    inputSpec,
    version: optional.apiVersion,
    description: optional.apiDescription,
    projectVersion: optional.apiVersion,
    groupId: namespace,
    ...optional
  }

  for (const [projectName, lang] of GENERATE) {
    const cc = new CodegenConfigurator({...shared, lang, projectName, outputDir: outFolder + '/' + projectName})
    const opts = await cc.toClientOptInput()
    new DefaultGenerator().opts(opts).generate()
  }
}
export function generatePackageJson ({
  npmScope,
  moduleName = '',
  reactNativeVersion,
  apiVersion = '1.0.0',
  apiDescription,
  apiAuthor,
  apiLicense,
  bridgeVersion = '',
  ...conf
} : {
  npmScope?: string,
  moduleName?: string,
  reactNativeVersion?: string,
  apiVersion?: string,
  apiDescription?: string,
  apiAuthor?: string,
  apiLicense?: string,
  bridgeVersion?: string,
  config?: any
}) {
  return JSON.stringify({
    'name': npmScope ? `@${npmScope}/${moduleName}` : moduleName,
    'version': apiVersion,
    'description': apiDescription,
    'main': 'javascript/src/index.js',
    'author': apiAuthor,
    'license': apiLicense,
    'scripts': {
      'prepublish': 'ern regen-api -u same',
      'flow': 'flow'
    },
    'devDependencies': {
      'flow-bin': FLOW_BIN_VERSION
    },
    'peerDependencies': {
      '@walmart/react-native-electrode-bridge': `${bridgeVersion.split('.')[0]}.x`
    },
    'ern': {
      'message': conf,
      'moduleType': `${ModuleTypes.API}`
    },
    'keywords': [
      `${ModuleTypes.API}`
    ]
  }, null, 2)
}

export function generateInitialSchema ({
  namespace,
  shouldGenerateBlankApi
} : {
  namespace?: string,
  shouldGenerateBlankApi?: boolean
}) {
  return shouldGenerateBlankApi ? '' : `
  {
    "swagger": "2.0",
    "info": {
      "description": "Walmart Item Module",
      "title": "WalmartItem",
      "contact": {
        "name": "ERN Mobile Platform Team"
      }
    },
    "paths": {
      "/items": {
        "get": {
          "tags": [
          "WalmartItem"
          ],
          "description": "Returns all items from the system that the user has access to",
          "operationId": "findItems",
          "parameters": [{
            "name": "limit",
            "in": "query",
            "description": "maximum number of results to return",
            "required": false,
            "type": "integer",
            "format": "int32"
          }],
          "responses": {
            "200": {
              "description": "Item response",
              "schema": {
                "type": "array",
                "items": {
                  "$ref": "#/definitions/Item"
                }
              }
            }
          }
        },
        "post": {
          "tags": [
          "WalmartItem"
          ],
          "description": "Creates a Item in the store.",
          "operationId": "addItem",
          "parameters": [{
            "name": "item",
            "in": "body",
            "description": "Item to add",
            "required": true,
            "schema": {
              "$ref": "#/definitions/Item"
            }
          }],
          "responses": {
            "200": {
              "schema": {
                "type": "boolean"
              }
            }
          }
        }
      },
      "event/itemAdded": {
        "event": {
          "tags": [
          "WalmartItem"
          ],
          "operationId": "itemAdded",
          "parameters": [{
            "name": "itemId",
            "in": "path",
            "description": "Event to notify new item added",
            "required": true,
            "type": "string"
          }]
        }
      }
    },
    "definitions": {
      "Item": {
        "type": "object",
        "required": [
        "name",
        "id"
        ],
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "desc": {
            "type": "string"
          }
        }
      }
    }
  }
  `
}

export function generateFlowConfig(): string  {
  return `
  [ignore]
  
  [include]
  
  [libs]
  
  [lints]
  
  [options]
  `
}

export default async function generateProject (config: Object = {}, outFolder: string) {
  await fileUtils.writeFile(path.join(outFolder, PKG_FILE), generatePackageJson(config))
  await fileUtils.writeFile(path.join(outFolder, MODEL_FILE), generateInitialSchema(config))
  await fileUtils.writeFile(path.join(outFolder, FLOW_CONFIG_FILE), generateFlowConfig())
  await generateSwagger(config, outFolder)
}

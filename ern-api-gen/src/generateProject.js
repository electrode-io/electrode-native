import path from 'path';
import {writeFile} from './fileUtil';
import {CodegenConfigurator, DefaultGenerator} from '@walmart/ern-message-gen'
import {
    PKG_FILE,
    MODEL_FILE
} from './Constants';

//export const GENERATE = [['android', 'ERNAndroid'], ["javascript", "ERNES6"], ["IOS", "ERNSwift"]
export const GENERATE = [['android', 'ERNAndroid'], ["javascript", "ERNES6"]];

export async function generateSwagger({apiSchemaPath = MODEL_FILE, name, namespace = '', ...optional}, outFolder) {
    const inputSpec = path.resolve(outFolder, apiSchemaPath);
    const shared = {
        apiPackage: `${namespace}.api`,
        modelPackage: `${namespace}.model`,
        inputSpec,
        version: optional.apiVersion,
        description: optional.apiDescription,
        groupId: namespace,
        ...optional,
    };

    for (const [projectName, lang] of GENERATE) {
        const cc = new CodegenConfigurator({...shared, lang, projectName, outputDir: outFolder + '/' + projectName});
        const opts = await cc.toClientOptInput();
        new DefaultGenerator().opts(opts).generate();
    }
}
export function generatePackageJson({
    npmScope,
    moduleName,
    reactNativeVersion,
    apiVersion = '1.0.0',
    apiDescription,
    apiAuthor,
    apiLicense,
    bridgeVersion,
    ...conf
}) {

    return JSON.stringify({
        "name": npmScope ? `@${npmScope}/${moduleName}` : moduleName,
        "version": apiVersion,
        "description": apiDescription,
        "main": "index.js",
        "author": apiAuthor,
        "license": apiLicense,
        "scripts": {
            "prepublish": "ern generate message regen -u same"
        },
        "peerDependencies": {
            "@walmart/react-native-electrode-bridge": bridgeVersion,
            'react-native': reactNativeVersion
        },
        "ern": {
            "message": conf
        }
    }, null, 2);

}

export function generateInitialSchema({namespace, shouldGenerateBlankApi}) {
    return shouldGenerateBlankApi ? '' : `
{
  "swaggerVersion": "1.2",
  "apis": [
    {
      "path": "/hello/{subject}",
      "operations": [
        {
          "method": "GET",
          "summary": "Greet our subject with hello!",
          "type": "string",
          "nickname": "helloSubject",
          "parameters": [
            {
              "name": "subject",
              "description": "The subject to be greeted.",
              "required": true,
              "type": "string",
              "paramType": "path"
            }
          ]
        }
      ]
    }
  ],
  "models": {}
}  
  
`
}


export default async function generateProject(config = {}, outFolder) {
    await writeFile(path.join(outFolder, PKG_FILE), generatePackageJson(config));
    await writeFile(path.join(outFolder, MODEL_FILE), generateInitialSchema(config));
    await generateSwagger(config, outFolder);

}

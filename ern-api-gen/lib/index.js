import runModelGen from "../../ern-model-gen/index.js";
import generateJavaCode from './generateJavaCode';
import generateObjectiveCCode from './generateObjectiveCCode';
import generatePackage from './generateProject';
import generateJSCode from './generateJSCode';
import {patchHull} from './renderer';
import normalizeConfig from './normalizeConfig';
import views from './views';
import {
    SCHEMA_FILE,
    PKG_FILE,
    MODEL_FILE
} from './Constants';
import cwd from './cwd';
import log from './log';
import {readJSON} from './fileUtil';

const fs = require('fs');
const chalk = require('chalk');
const shell = require('shelljs');
const path = require('path');


// Not pretty but depending of the execution context (direct call to binary
// v.s using api-gen in a node program) the path might include distrib
// This is just a temporary work-around, find out a cleaner way
const apiGenDir = path.join(__dirname, '..');


/**
 * Generate JS/Android code
 * view : the mustache view to use
 */
async function generateAllCode(view) {
    await generateJavaCode(view, apiGenDir);
    await generateObjectiveCCode(view, apiGenDir);
    await generateJSCode(view, apiGenDir);
}


function hasModelSchema(modelsSchemaPath = cwd(MODEL_FILE)) {
    return fs.existsSync(modelsSchemaPath) && modelsSchemaPath;
}


/**
 * ==============================================================================
 * Main entry point
 * ==============================================================================
 *
 *
 * schemaFilePath : path to a schema file to be used as input (OPTIONAL)
 * configFilePath : path to a config file to be used as input (OPTIONAL)
 * shouldPublishToNpm : true to publish to npm after generation, false otherwise
 */
export async function generateApi(options) {

    //--------------------------------------------------------------------------
    // Get input
    //--------------------------------------------------------------------------
    // Two ways to provide needed input to apigen :
    // - Through a schema file (in that case, a config object will be generated
    // from the schema)
    // - Directly giving a config file, skipping schema conversion
    //
    // Order of precedence when trying to get input :
    // - schema from schemaFilePath (provided by apigen method caller)
    // - config from configFilePath (provided by apigen method caller)
    // - default schema file
    // - default config file

    let config = normalizeConfig(options);
    const outFolder = cwd(config.moduleName);
    if (fs.existsSync(outFolder)) {
        log.warn(`A directory already exists at ${outFolder}`);
        process.exit(1);
    }
    // Create output folder
    shell.mkdir(outFolder);
    await generatePackage(config, outFolder);

    log.info(`==  Generated project: 
        $ cd ${outFolder}
        $ npm install
        `);
}
export async function cleanGenerated(outFolder = cwd()) {
    if (!/react-native-(.*)-api$/.test(outFolder) || !fs.existsSync(cwd(SCHEMA_FILE))) {
        throw new Error(`Refusing to clean non api project`);
    }
    shell.rm('-rf', path.join(outFolder, 'js'));
    shell.rm('-rf', path.join(outFolder, 'ios'));
    shell.rm('-rf', path.join(outFolder, 'android'));
    shell.rm('-f', path.join(outFolder, 'index.js'));
}

export async function generateCode(options) {
    log.info('== Regenerating Code')

    const pkg = await readJSON(cwd(PKG_FILE));
    if (!/react-native-(.*)-api$/.test(pkg.name)) {
        throw new Error(`Is this an api directory not a valid name try react-native-{name}-api`);
    }
    const config = normalizeConfig(Object.assign({}, {
        name: pkg.name,
        apiVersion: pkg.version,
        apiDescription: pkg.description,
        apiAuthor: pkg.author
    }, options));

    const outFolder = cwd();

    await cleanGenerated();

    // Copy the api hull (skeleton code with inline templates) to output folder
    shell.cp('-r', `${apiGenDir}/api-hull/*`, outFolder);


    //--------------------------------------------------------------------------
    // Construct output path + java/js generation paths
    //--------------------------------------------------------------------------
    let destPath = config.namespace.replace(/\./g, '/');

    config.javaDest = `android/lib/src/main/java/${destPath}/${config.apiName}/api`;
    config.objCDest = `ios`;
    config.jsDest = `js`;

    //--------------------------------------------------------------------------
    // Mustache view creation
    //-----------------------------------------------------------config.apiName---------------

    const mustacheView = await views(config, outFolder);
    //--------------------------------------------------------------------------
    // Kickstart generation
    //--------------------------------------------------------------------------

    // Start by patching the api hull "inplace"
    log.info("== Patching Hull");
    await patchHull(mustacheView);
    // Inject all additional generated code
    log.info("== Generating API code");
    await generateAllCode(mustacheView);

    log.info("== Generation complete");

    const schemaPath = hasModelSchema(config.modelsSchemaPath);

    if (schemaPath) {
        await runModelGen({
            javaModelDest: `${outFolder}/android/lib/src/main/java/${destPath}/${config.apiName}/model`,
            javaPackage: `${config.namespace}.${config.apiName.toLowerCase()}.model`,
            objCModelDest: `${outFolder}/ios/MODEL`,
            schemaPath
        })
    }
}

import runModelGen from "../ern-model-gen/index.js";
import parseApiSchema from './lib/parseApiSchema';
const fs = require('fs');
const child_process = require('child_process');
const execSync = child_process.execSync;

const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const findKey = require('lodash.findkey');
const Mustache = require('mustache');
const readDir = require('fs-readdir-recursive');
const shell = require('shelljs');
const xcode = require('xcode');
const path = require('path');

const cwd = path.join.bind(path, process.cwd());

const SCHEMA_FILE = 'apigen.schema';
const CONFIG_FILE = 'apigen.conf.json';
const PKG_FILE = 'package.json';
const MODEL_FILE = 'schema.json';

const rootDir = shell.pwd();

const log = require('console-log-level')({
    prefix(level) {
        return '[ern-api-gen]'
    },
    level: 'info'
});

// Not pretty but depending of the execution context (direct call to binary
// v.s using api-gen in a node program) the path might include distrib
// This is just a temporary work-around, find out a cleaner way
const apiGenDir = __dirname.replace('/distrib', '');


// List of currently schema supported primitive types
const primitiveTypes = [
    "Boolean",
    "Integer",
    "Double",
    "Float",
    "String"
];

const androidPrimitiveTypes = [
    "bool",
    "int",
    "double",
    "float",
    "string"
];

/**
 * ==============================================================================
 * Async wrappers around node fs
 * ==============================================================================
 */
async function readFile(filename, encoding) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, encoding, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
async function readJSON(filename) {
    return readFile(filename, 'utf8').then(JSON.parse);
}
async function writeFile(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}
function generateConfigFromSchemaSync(file) {
    return parseApiSchema(fs.readFileSync(file, 'utf8'));
}
/**
 *
 * ==============================================================================
 * Mustache related utilities
 * ==============================================================================
 *
 * Mustache render using a template file and a view
 * tmplPath: Path to the template file
 * view: Mustache view to apply to the template
 * returns: Rendered string output
 *
 */
async function mustacheRenderUsingTemplateFile(tmplPath, view) {
    const template = await readFile(tmplPath, 'utf-8');
    try {
        return Mustache.render(template, view);
    } catch (e) {
        log.warn(`error rendering ${tmplPath}`, e.message);
        throw e;
    }
}

// Mustache render to an output file using a template file and a view
// tmplPath: Path to the template file
// view: Mustache view to apply to the template
// outPath: Path to the output file
async function mustacheRenderToOutputFileUsingTemplateFile(tmplPath, view, outPath) {
    const output = await mustacheRenderUsingTemplateFile(tmplPath, view);
    return writeFile(outPath, output);
}

/**
 * ==============================================================================
 * Misc utilities
 * ==============================================================================
 * Given a string returns the same string with its first letter capitalized
 */
function pacalCase(string) {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}

/**
 * true if the given type is a type array, false othewise
 */

function isArrayType(type) {
    return type.includes('[]');
}

/**
 * return the type backed by the array. for example Integer[] will return Integer
 * and LatLng[] will return LatLng
 */
function getArrayType(type) {
    return type.replace('[]', '');
}


/**
 * Generate all Java code
 * view : The mustache view to use
 */
async function generateJavaCode(view) {
    try {
        const javaOutputPath = view.javaDest ? view.javaDest : 'output/java';
        shell.mkdir('-p', cwd(javaOutputPath));

        log.info(`Generating ${javaOutputPath}/${view.pascalCaseApiName}ApiClient.java`);
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${apiGenDir}/templates/java/ApiClient.java.mustache`,
            view,
            cwd(`${javaOutputPath}/${view.pascalCaseApiName}ApiClient.java`));

        log.info(`Generating ${javaOutputPath}/${view.pascalCaseApiName}Api.java`);
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${apiGenDir}/templates/java/Api.java.mustache`,
            view,
            cwd(`${javaOutputPath}/${view.pascalCaseApiName}Api.java`));

        log.info(`Generating ${javaOutputPath}/Names.java`);
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${apiGenDir}/templates/java/Names.java.mustache`,
            view,
            cwd(`${javaOutputPath}/Names.java`));
    } catch (e) {
        log.error('generateJavaCode', e);
        throw e;
    }
}

/**
 *  Generate Objective-C code
 *   view : The mustache view to use
 */
async function generateObjectiveCCode(view) {
    const objCOutputPath = view.objCDest || 'output/objc';
    shell.mkdir('-p', objCOutputPath);

    const headerFiles = [
        `${view.pascalCaseApiName}Api.h`,
        `${view.pascalCaseApiName}ApiClient.h`,
        'Names.h'
    ];

    const sourceFiles = [
        `${view.pascalCaseApiName}Api.m`,
        `${view.pascalCaseApiName}ApiClient.m`,
        'Names.m'
    ];

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}Api.h`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Api.h.mustache`,
        view,
        `${objCOutputPath}/API/${headerFiles[0]}`);

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}Api.m`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Api.m.mustache`,
        view,
        `${objCOutputPath}/API/${sourceFiles[0]}`);

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}ApiClient.h`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/ApiClient.h.mustache`,
        view,
        `${objCOutputPath}/API/${headerFiles[1]}`);

    log.info(`Generating ${objCOutputPath}/API/${view.pascalCaseApiName}ApiClient.m`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/ApiClient.m.mustache`,
        view,
        `${objCOutputPath}/API/${sourceFiles[1]}`);

    log.info(`Generating ${objCOutputPath}/API/Names.h`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Names.h.mustache`,
        view,
        `${objCOutputPath}/API/${headerFiles[2]}`);

    log.info(`Generating ${objCOutputPath}/API/Names.m`);
    await mustacheRenderToOutputFileUsingTemplateFile(
        `${apiGenDir}/templates/obj-c/Names.m.mustache`,
        view,
        `${objCOutputPath}/API/${sourceFiles[2]}`);

    const projectPath = `${rootDir}/${objCOutputPath}/API.xcodeproj/project.pbxproj`;
    const xcodeProject = xcode.project(projectPath);

    xcodeProject.parse((error) => {
        if (error) {
            console.error(error);
            return;
        }
        const group = xcodeProject.pbxGroupByName('API');
        const groupKey = findKey(xcodeProject.hash.project.objects['PBXGroup'], group);
        headerFiles.forEach((h) => xcodeProject.addHeaderFile(h, {}, groupKey));
        sourceFiles.forEach((s) => xcodeProject.addSourceFile(s, {}, groupKey));
        fs.writeFileSync(projectPath, xcodeProject.writeSync());
    });
}

/**
 * Generate all JS code
 * view : The mustache view to use
 */
async function generateJSCode(view) {
    try {
        const jsOutputPath = view.jsDest ? view.jsDest : 'output/js';
        shell.mkdir('-p', jsOutputPath);

        log.info(`Generating ${jsOutputPath}/apiClient.js`);
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${apiGenDir}/templates/js/apiClient.js.mustache`,
            view,
            `${jsOutputPath}/apiClient.js`);

        log.info(`Generating ${jsOutputPath}/api.js`);
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${apiGenDir}/templates/js/api.js.mustache`,
            view,
            `${jsOutputPath}/api.js`);

        log.info(`Generating ${jsOutputPath}/messages.js`);
        await mustacheRenderToOutputFileUsingTemplateFile(
            `${apiGenDir}/templates/js/messages.js.mustache`,
            view,
            `${jsOutputPath}/messages.js`);
    } catch (e) {
        log.error('generateJSCode', e);
        throw e;
    }
}

/**
 * Generate JS/Android code
 * view : the mustache view to use
 */
async function generateAllCode(view) {
    try {
        await generateJavaCode(view);
        await generateObjectiveCCode(view);
        await generateJSCode(view);
    } catch (e) {
        log.error('generateAllCode', e);
        throw e;
    }
}

/**
 * Patch api hull (global method for JS/Java, might need to be platform splitted)
 * view : The mustache view to use
 */
const ignoreRe = /node_modules\/|jar$/;
async function patchHull(view) {
    const files = readDir(view.outFolder).filter(file => {
        return !ignoreRe.test(file)
    });

    try {
        // Mustache render all files (even those not containing inline templates
        // for the sake of simplicity)
        for (const file of files) {
            await mustacheRenderToOutputFileUsingTemplateFile(
                `${view.outFolder}/${file}`,
                view,
                `${view.outFolder}/${file}`);
        }
    } catch (e) {
        log.error('patchHull', e);
        throw e;
    }
}


function addIfModelObject(models, type) {
    if (type
        && !isArrayType(type)
        && !primitiveTypes.includes(type)) {
        models.add(type);
    }
}

function hasModelSchema(modelsSchemaPath = cwd(MODEL_FILE)) {
    return fs.existsSync(modelsSchemaPath) && modelsSchemaPath;
}
function generatePackageJson({
    npmScope,
    moduleName,
    reactNativeVersion,
    apiVersion = '1.0.0', apiDescription, apiAuthor, apiLicense, bridgeVersion
}) {
    return JSON.stringify({
        "name": npmScope ? `${npmScope}@${moduleName}` : moduleName,
        "version": apiVersion,
        "description": apiDescription,
        "main": "index.js",
        "author": apiAuthor,
        "license": apiLicense,
        "scripts": {
            "regen": "ern generate api regen .",
            "preinstall": "ern generate api regen ."
        },
        "dependencies": {
            "@walmart/react-native-electrode-bridge": bridgeVersion,
            'react-native': reactNativeVersion
        }
    }, null, 2);

}
function generateInitialModel() {
    return JSON.stringify({
        type: "Object",
        name: "LatLng",
        properties: {
            "lat": {
                "type": "number"
            },
            "lng": {
                "type": "number"
            },
            "name": {
                "type": "string"
            }
        }
    }, null, 2);
}
function generateInitialSchema({namespace}) {

    return `namespace ${namespace}
// Event with no payload
event weatherUpdated

// Event with a primitive type payload
event weatherUdpatedAtLocation(location: String)

// Event with complex type payload
event weatherUpdatedAtPosition(position: LatLng)

// Request with no request payload and no response payload
request refreshWeather()
`
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
export default async function generatePackage(options) {

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

    let config = _generateConfig(options);
    const outFolder = cwd(config.moduleName);
    if (fs.existsSync(outFolder)) {
        log.warn(`A directory already exists at ${outFolder}`);
        process.exit(1);
    }
    // Create output folder
    shell.mkdir(outFolder);
    await writeFile(path.join(outFolder, PKG_FILE), generatePackageJson(config));
    await writeFile(path.join(outFolder, SCHEMA_FILE), generateInitialSchema(config));
    await writeFile(path.join(outFolder, MODEL_FILE), generateInitialModel(config));

    log.info(`==  Generated project next: 
        $ cd ${outFolder}
        $ npm install
        `);
}

//generate a configuration.  This looks in the apigen schema
// and the things passed in.
function _generateConfig({
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

    if (/.*react-native-(.*)-api$/.test(name)) {
        simpleName = /.*react-native-(.*)-api$/.exec(name).pop();
    }

    let config = {};
    if (/@/.test(apiName)) {
        const [all, nScope, nName] =/^(?:([^@]*)@)?(.*)$/.exec(name);
        if (!apiName) apiName = nName;
        if (!npmScope) npmScope = nScope;
    }

    if (fs.existsSync(schemaFilePath)) {
        Object.assign(config, generateConfigFromSchemaSync(schemaFilePath));
    } else if (fs.existsSync(configFilePath)) {
        Object.assign(JSON.parse(fs.readFileSync(configFilePath, 'utf-8')));
    }
    if (apiName) {
        config.apiName = apiName;
    } else if (!config.apiName) {
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
    if (moduleName) {
        config.moduleName = moduleName;
    } else if (!config.moduleName) {
        config.moduleName = `react-native-${simpleName}-api`;
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

const rnRe = /react-native-(.*)-api$/;


export async function generateCode(options) {
    log.info('== Regenerating Code')

    const pkg = await readJSON(cwd('package.json'));
    if (!/react-native-(.*)-api$/.test(pkg.name)) {
        throw new Error(`Is this an api directory not a valid name try react-native-{name}-api`);
    }
    const config = _generateConfig(Object.assign({}, {
        name: pkg.name,
        apiVersion: pkg.version,
        apiDescription: pkg.description,
        apiAuthor: pkg.author
    }, options));
    const outFolder = cwd();
    try {
        shell.rm('-rf', path.join(outFolder, 'js'));
        shell.rm('-rf', path.join(outFolder, 'ios'));
        shell.rm('-rf', path.join(outFolder, 'android'));
        shell.rm('-f', path.join(outFolder, 'README.md'));
        shell.rm('-f', path.join(outFolder, 'index.js'));

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
        // Start fresh
        //--------------------------------------------------------------------------


        //--------------------------------------------------------------------------
        // Mustache view creation
        //-----------------------------------------------------------config.apiName---------------

        //
        // Common view (should be usefull stuff for Android/JS/iOS)
        const commonView = {
            // == Global ==
            // package is used for android but also for react-native-electrode-bridge
            // messages namespacing to avoid message naming collision between different
            // applications
            "package": `${config.namespace}.${config.apiName.toLowerCase()}`,
            // == Global ==
            // pascal cased api name. Useful for ex to generate class names starting
            // with the api name (by convention class names are pascal cased)
            "pascalCaseApiName": `${pacalCase(config.apiName)}`,
            // == Per event/request ==
            // pascal cased name (event name or request name)
            "pascalCaseName": function () {
                return pacalCase(this.name);
            },
            // == Global ==
            // Return an array of strings being all complex types names used in payloads
            // of events and requests (for example "LatLng", "Person" ...)
            // This can be used for multiple purposes. For Java generation it helps
            // to generate correct import statements to import model classes
            "models": function () {
                // todo : cache this somehow
                let models = new Set();
                for (let property in config) {
                    if (config.hasOwnProperty(property)) {
                        if (property === 'events'
                            || property === 'requests') {
                            for (let item of config[property]) {
                                if (item.payload) {
                                    addIfModelObject(models, item.payload.type)
                                }
                                addIfModelObject(models, item.respPayloadType)
                            }
                        }
                    }
                }
                return Array.from(models);
            },
            // == Per event/request ==
            // True if this event has a payload
            // (might get renamed to hasEventPayload to different with requests)
            "hasPayload": function () {
                return this.payload !== undefined;
            },
            // == Per event/request ==
            // The name of the constant defining the message name
            // It is based on the event/request name
            // For example weatherUpdated event definition will result in the following
            // constant name identifying the message : WEATHER_UPDATED
            "constantName": function () {
                return this.name.replace(/([A-Z])/g, "_$1").toUpperCase()
            },
            // == Per event/request ==
            // The message name itself (as used by react-native-electrode-bridge)
            // It is based on the event/request name and prefixed by the package name
            // to avoid message naming collision
            // For example weatherUpdated event definition with a namespace being
            // 'com.mycompany' and an api name being 'foo', will result in the following
            // message name : "com.mycompany.foo.weather.updated"
            "bridgeMessageName": function () {
                return `${commonView.package}.${this.name.replace(/([A-Z])/g, ".$1")}`
                    .toLowerCase()
            },
            // == Global ==
            // Used to generate the NPM module name, but also as the groupId for maven
            // publication in the JAVA generation case
            "moduleName": config.moduleName,
            // == Global ==
            // Generation output folder
            "outFolder": outFolder
        };

        //
        // Java specific view
        const javaView = {
            // JAVA code to use for payload deserialization
            "payloadDeserialization": function () {
                if (!this.payload) {
                    return "Object payload = null;";
                }
                // Array
                if (isArrayType(this.payload.type)) {
                    const arrayType = getArrayType(this.payload.type);
                    // Array of a primitive type
                    if (primitiveTypes.includes(arrayType)) {
                        let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                        return `${this.payload.type} payload = bundle.get${objType}Array("${this.payload.name}");`;
                    }
                    // Array of a complex object type
                    else {
                        return `Parcelable[] p = bundle.getParcelableArray("${this.payload.name}");
                        ${this.payload.type} payload = new ${arrayType}[p.length];
                        System.arraycopy(p, 0, payload, 0, p.length);`;
                    }
                }
                // No array
                else {
                    if (primitiveTypes.includes(this.payload.type)) {
                        const primType = (this.payload.type === 'Integer' ? 'Int' : this.payload.type);
                        return `${this.payload.type} payload = bundle.get${primType}("${this.payload.name}");`;
                    } else {
                        return `${this.payload.type} payload = ${this.payload.type}.fromBundle(bundle);`;
                    }
                }
            },
            // JAVA code to use for payload serialization (request payload / event payload)
            "payloadSerizalization": function () {
                // Array
                if (isArrayType(this.payload.type)) {
                    const arrayType = getArrayType(this.payload.type);
                    // Array of a primitive type
                    if (primitiveTypes.includes(arrayType)) {
                        let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                        return `new Bundle(); bundle.put${objType}Array("${this.payload.name}", ${this.payload.name});`;
                    }
                    // Array of a complex object type
                    else {
                        return `new Bundle(); bundle.putParcelableArray("${this.payload.name}", ${this.payload.name});`;
                    }
                }
                // Not Array
                else {
                    if (primitiveTypes.includes(this.payload.type)) {
                        const primType = (this.payload.type === 'Integer' ? 'Int' : this.payload.type);
                        return `new Bundle(); bundle.put${primType}("${this.payload.name}",\
                   ${this.payload.name});`;
                    } else {
                        return `${this.payload.name}.toBundle();`;
                    }
                }
            },
            // JAVA code to use for payload serialization (response payload)
            "responsePayloadSerialization": function () {
                // Array
                if (isArrayType(this)) {
                    const arrayType = getArrayType(this);
                    // Array of a primitive type
                    if (primitiveTypes.includes(arrayType)) {
                        let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                        return `new Bundle(); bundle.put${objType}Array("rsp", obj);`;
                    }
                    // Array of a complex object type
                    else {
                        throw new Error("Complex object type arrays are not supported yet");
                    }
                }
                // Not Array
                else {
                    // Primitive type
                    if (primitiveTypes.includes(this)) {
                        const primType = (this === 'Integer' ? 'Int' : this);
                        return `new Bundle(); bundle.put${primType}("rsp", obj);`;
                    }
                    // Complex object type
                    else {
                        return `obj.toBundle();`;
                    }
                }
            },
            // JAVA Code to use for payload deserialization (response payload)
            "responsePayloadDeserialization": function () {
                // Array
                if (isArrayType(this)) {
                    const arrayType = getArrayType(this);
                    // Array of a primitive type
                    if (primitiveTypes.includes(arrayType)) {
                        let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
                        return `${this} payload = bundle.get${objType}Array("rsp");`;
                    }
                    // Array of a complex object type
                    else {
                        throw new Error("Complex object type arrays are not supported yet");
                    }
                }
                // Not Array
                else {
                    // Primitive type
                    if (primitiveTypes.includes(this)) {
                        const primType = (this === 'Integer' ? 'Int' : this);
                        return `bundle.get${primType}("rsp")`;
                    }
                    // Complex object type
                    else {
                        return `${this}.fromBundle(bundle)`;
                    }
                }
            }
        };

        // Build composite final mustache view
        const mustacheView = Object.assign({}, config, commonView, javaView);

        //--------------------------------------------------------------------------
        // Kickstart generation
        //--------------------------------------------------------------------------

        // Start by patching the api hull "inplace"
        log.info("== Patching Hull");
        await
            patchHull(mustacheView);
        // Inject all additional generated code
        log.info("== Generating API code");
        await
            generateAllCode(mustacheView);

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

    } catch (e) {
        log.error('generateApiModule', e);
    }
}

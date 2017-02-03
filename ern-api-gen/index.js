import initModelGen from "../ern-model-gen/index.js";
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

const defaultSchemaFile = 'apigen.schema';
const defaultConfigFile = 'apigenconf.json';

//
// List of currently schema supported primitive types
const primitiveTypes = [
  "Boolean",
  "Integer",
  "Double",
  "Float",
  "String"
]

const androidPrimitiveTypes = [
  "bool",
  "int",
  "double",
  "float",
  "string"
]

//==============================================================================
// Async wrappers around node fs
//==============================================================================

async function readFile(filename, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

async function writeFile(filename, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

//==============================================================================
// Mustache related utilities
//==============================================================================

// Mustache render using a template file and a view
// tmplPath: Path to the template file
// view: Mustache view to apply to the template
// returns: Rendered string output
async function mustacheRenderUsingTemplateFile(tmplPath, view) {
  const template = await readFile(tmplPath, 'utf-8');
  return Mustache.render(template, view);
}

// Mustache render to an output file using a template file and a view
// tmplPath: Path to the template file
// view: Mustache view to apply to the template
// outPath: Path to the output file
async function mustacheRenderToOutputFileUsingTemplateFile(tmplPath, view, outPath) {
  const output = await mustacheRenderUsingTemplateFile(tmplPath, view);
  return writeFile(outPath, output);
}

//==============================================================================
// Misc utitlities
//==============================================================================

// Given a string returns the same string with its first letter capitalized
function pacalCase(string) {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}

// true if the given type is a type array, false othewise
function isArrayType(type) {
  return type.includes('[]');
}

// return the type backed by the array. for example Integer[] will return Integer
// and LatLng[] will return LatLng
function getArrayType(type) {
  return type.replace('[]', '');
}

function androidObjTypeToPrimitive(type) {
  switch (type) {
    case 'Boolean' : return 'bool';
    case 'Integer' : return 'int';
    case 'Double' : return 'double';
    case 'Float' : return 'float';
    case 'String' : return 'string';
  }
}

function androidObjTypeArrToPrimitiveArr(type) {
  switch (type) {
    case 'Boolean[]' : return 'bool[]';
    case 'Integer[]' : return 'int[]';
    case 'Double[]' : return 'double[]';
    case 'Float[]' : return 'float[]';
    case 'String[]' : return 'string[]';
  }
}

//==============================================================================
// Generate configuration from a schema file
//==============================================================================
// Sample Schema file (any construct not part of this schema sample is not
// currently supported by this version of ern-apigen)
/*
namespace com.walmartlabs.ern
npmscope walmart
apiname dummy
apiversion 0.0.5

// Event with no payload
event weatherUpdated

// Event with a primitive type payload
event weatherUdpatedAtLocation(location: String)

// Event with complex type payload
event weatherUpdatedAtPosition(position: LatLng)

// Request with no request payload and no response payload
request refreshWeather()

// Request with a single request payload and no response payload
request refreshWeatherFor(location: String)

// Request with a single request payload and a response payload
request getTemperatureFor(location: String) : Integer

// Request with no request payload and a response payload
request getCurrentTemperature() : Integer

// Request with no request payload an an array response payload
request getCurrentTemparatures() : Integer[]
*/
function generateConfigFromSchemaSync(schemaFilePath) {
  try {
    let config = {};
    let events = [];
    let requests = [];

    //
    // Regexes matching global configuration schema statements
    const namespaceRe = /namespace\s(.*)/;
    const apinameRe = /apiname\s(.*)/;
    const apiversionRe = /apiversion\s(.*)/;
    const npmScopeRe = /npmscope\s(.*)/;

    //
    // Regexes matching events schema statements
    const eventWithPayloadRe = /event (.+)\({1}(.+):\s(.+)\){1}/;
    const eventWoPayloadRe = /event ([a-zA-Z]+)/;

    //
    // Regexes matching requests schema statements

    // request without request payload and without response payload
    const requestWoReqPWoResP = /request\s{1}([a-zA-Z]+)\(\)$/;
    // request with a request payload and no response payload
    const requestWReqPWoResP = /request (.+)\({1}(.+):\s(.+)\){1}$/;
    // request with a request payload and a response payload
    const requestWReqPWResP = /request (.+)\({1}(.+):\s(.+)\){1}\s:\s(.+)/;
    // request with no request payload and a reponse payload
    const requestWoReqPWResP = /request\s{1}([a-zA-Z]+)\(\)\s:\s(.+)/;

    //
    // Schema to config workhouse
    const schema = fs.readFileSync(schemaFilePath, 'utf-8');
    const lines = schema.split('\n');

    // Todo : Quite some duplication going on in the following for block
    // refactor accordingly to minimize code duplication
    for (const line of lines) {
      // Handles statement declaring an event with payload
      // Sample statement :
      //   event weatherUpdatedAtPosition(position: LatLng)
      // Will produce :
      //  {
      //    "name": "weatherUpdatedAtPosition",
      //    "payload": {
      //      "type": "LatLng",
      //      "name": "position"
      //    }
      //  }
      if (eventWithPayloadRe.test(line)) {
        const eventName = eventWithPayloadRe.exec(line)[1];
        const eventPayloadName = eventWithPayloadRe.exec(line)[2];
        let eventPayloadType = eventWithPayloadRe.exec(line)[3];

        //if (isArrayType(eventPayloadType)) {
        //  eventPayloadType = androidObjTypeArrToPrimitiveArr(eventPayloadType);
        //}

        events.push({
          "name": eventName,
          "payload": {
            "type": eventPayloadType,
            "name": eventPayloadName
          }
        });
      }
      // Handles statement declaring an event with no payload
      // Sample statement :
      //   event weatherUpdated
      // Will produce :
      //  {
      //    "name": "weatherUpdated"
      //  }
      else if (eventWoPayloadRe.test(line)) {
        const eventName = eventWoPayloadRe.exec(line)[1];
        events.push({
          "name": eventName
        });
      }
      // Handles statement declaring a request with no request payload and
      // no response payload
      // Sample statement :
      //   request refreshWeather()
      // Will produce :
      //  {
      //    "name": "refreshWeather"
      //  }
      else if (requestWoReqPWoResP.test(line)) {
        const requestName = requestWoReqPWoResP.exec(line)[1];
        requests.push({
          "name": requestName
        });
      }
      // Handles statement declaring a request with a single request payload
      // and no response payload
      // Sample statement :
      //   request refreshWeatherFor(location: String)
      // Will produce :
      // {
      //   "name": "refreshWeatherFor",
      //   "payload": {
      //     "type": "String",
      //     "name": "location"
      //   }
      // }
      else if (requestWReqPWoResP.test(line)) {
        const requestName = requestWReqPWoResP.exec(line)[1];
        const requestPayloadName = requestWReqPWoResP.exec(line)[2];
        const requestPayloadType = requestWReqPWoResP.exec(line)[3];
        requests.push({
          "name": requestName,
          "payload": {
            "type": requestPayloadType,
            "name": requestPayloadName
          }
        });
      }
      // Handles statement declaring a request with a single request payload
      // and a response payload
      // Sample statement :
      //  request getTemperatureFor(location: String) : Integer
      // Will produce
      // {
      //   "name": "getTemperatureFor",
      //   "payload": {
      //     "type": "String",
      //     "name": "location"
      //   },
      //   "respPayloadType": "Integer"
      // }
      //
      else if (requestWReqPWResP.test(line)) {
        const requestName = requestWReqPWResP.exec(line)[1];
        const requestPayloadName = requestWReqPWResP.exec(line)[2];
        const requestPayloadType = requestWReqPWResP.exec(line)[3];
        let responsePayloadType = requestWReqPWResP.exec(line)[4];

        requests.push({
          "name": requestName,
          "payload": {
            "type": requestPayloadType,
            "name": requestPayloadName
          },
          "respPayloadType": responsePayloadType
        });
      }
      // Handles statement declaring a request with no request payload and a
      // response payload
      // Sample statement :
      //  request getCurrentTemperature() : Integer
      // Will produce
      // {
      //   "name": "getCurrentTemperature",
      //   "respPayloadType": "Integer"
      // }
      else if (requestWoReqPWResP.test(line)) {
        const requestName = requestWoReqPWResP.exec(line)[1];
        let responsePayloadType = requestWoReqPWResP.exec(line)[2];

        requests.push({
          "name": requestName,
          "respPayloadType": responsePayloadType
        });
      }
      // Handles global configuration statements
      else if (namespaceRe.test(line)) {
        config.namespace = namespaceRe.exec(line)[1];
      } else if (apinameRe.test(line)) {
        config.apiName = apinameRe.exec(line)[1];
      } else if (apiversionRe.test(line)) {
        config.apiVersion = apiversionRe.exec(line)[1];
      } else if (npmScopeRe.test(line)) {
        config.npmScope = npmScopeRe.exec(line)[1];
      }
    }

    // Add all events to config
    config.events = events;
    // Add all requests to config
    config.requests = requests;

    return config;
  } catch(e) {
    log.error('generateConfigFromSchemaSync', e);
    throw e;
  }
}

// Generate all Java code
// view : The mustache view to use
async function generateJavaCode(view) {
  try {
    const javaOutputPath = view.javaDest ? view.javaDest : 'output/java';
    shell.mkdir('-p', javaOutputPath);

    log.info(`Generating ${javaOutputPath}/${view.pascalCaseApiName}ApiClient.java`);
    await mustacheRenderToOutputFileUsingTemplateFile(
      `${apiGenDir}/templates/java/ApiClient.java.mustache`,
      view,
      `${javaOutputPath}/${view.pascalCaseApiName}ApiClient.java`);

    log.info(`Generating ${javaOutputPath}/${view.pascalCaseApiName}Api.java`);
    await mustacheRenderToOutputFileUsingTemplateFile(
      `${apiGenDir}/templates/java/Api.java.mustache`,
      view,
      `${javaOutputPath}/${view.pascalCaseApiName}Api.java`);

    log.info(`Generating ${javaOutputPath}/Names.java`);
    await mustacheRenderToOutputFileUsingTemplateFile(
      `${apiGenDir}/templates/java/Names.java.mustache`,
      view,
      `${javaOutputPath}/Names.java`);
  } catch (e) {
    log.error('generateJavaCode', e);
    throw e;
  }
}

//
// Generate Objective-C code
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

// Generate all JS code
// view : The mustache view to use
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

// Generate JS/Android code
// view : the mustache view to use
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

// Patch api hull (global method for JS/Java, might need to be platform splitted)
// view : The mustache view to use
async function patchHull(view) {
  const files = readDir(view.outFolder, file => !file.endsWith('.jar'));

  try {
    // Mustache render all files (even those not containing inline templates
    // for the sake of simplicity)
    for (const file of files) {
      await mustacheRenderToOutputFileUsingTemplateFile(
        `${view.outFolder}/${file}`,
        view,
        `${view.outFolder}/${file}`);
    }
  } catch(e) {
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

function hasModelSchema() {
    return fs.existsSync(path.resolve(process.cwd(), 'schema.json'));
}

//==============================================================================
// Main entry point
//==============================================================================

// schemaFilePath : path to a schema file to be used as input (OPTIONAL)
// configFilePath : path to a config file to be used as input (OPTIONAL)
// shouldPublishToNpm : true to publish to npm after generation, false otherwise
export default async function generateApi({
  bridgeVersion,
  schemaFilePath,
  configFilePath,
  shouldPublishToNpm = false
} = {}) {
  try {
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

    let config;
    const defaultSchemaFile = 'apigen.schema';
    const defaultConfigFile = 'apigen.conf.json';

    if (schemaFilePath) {
      config = generateConfigFromSchemaSync(schemaFilePath);
    } else if (configFilePath) {
      config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
    } else if (fs.existsSync(`${rootDir}/${defaultSchemaFile}`)) {
      config = generateConfigFromSchemaSync(`${rootDir}/${defaultSchemaFile}`);
    } else if (fs.existsSync(`${rootDir}/${defaultConfigFile}`)) {
      config = JSON.parse(fs.readFileSync(`${rootDir}/${defaultConfigFile}`, 'utf-8'));
    } else {
      log.error('apigen', 'no config or schema provided or found');
    }

    config.moduleName = `react-native-${config.apiName}-api`;
    config.bridgeVersion = bridgeVersion;

    //--------------------------------------------------------------------------
    // Construct output path + java/js generation paths
    //--------------------------------------------------------------------------
    const outFolder = `${config.moduleName}-generated`;
    let path = config.namespace.replace(/\./g, '/');
    config.javaDest =
    `${outFolder}/android/lib/src/main/java/${path}/${config.apiName}/api`;
    config.objCDest = `${outFolder}/ios`;
    config.jsDest = `${outFolder}/js`;

    //--------------------------------------------------------------------------
    // Start fresh
    //--------------------------------------------------------------------------

    // Delete potentially pre-existing output folder
    shell.rm('-rf', outFolder);
    // Create output folder
    shell.mkdir(outFolder);
    // Copy the api hull (skeleton code with inline templates) to output folder
    shell.cp('-r', `${apiGenDir}/api-hull/*`, outFolder);

    //--------------------------------------------------------------------------
    // Mustache view creation
    //--------------------------------------------------------------------------

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
      "pascalCaseName": function() {
       return pacalCase(this.name);
      },
      // == Global ==
      // Return an array of strings being all complex types names used in payloads
      // of events and requests (for example "LatLng", "Person" ...)
      // This can be used for multiple purposes. For Java generation it helps
      // to generate correct import statements to import model classes
      "models": function() {
       // todo : cache this somehow
        let models = new Set();
        for (let property in config) {
            if (config.hasOwnProperty(property)) {
                if (property === 'events'
                    || property === 'requests') {
                    for (let item of config[property]) {
                        if(item.payload) {
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
      "hasPayload": function() {
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
      "bridgeMessageName": function() {
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
    }

    //
    // Java specific view
    const javaView = {
      // JAVA code to use for payload deserialization
      "payloadDeserialization": function() {
        if (!this.payload) {
         return "null";
        }
        // Array
        if (isArrayType(this.payload.type)) {
          const arrayType = getArrayType(this.payload.type);
          // Array of a primitive type
          if (primitiveTypes.includes(arrayType)) {
            let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
            return `bundle.get${objType}Array("${this.payload.name}")`;
          }
          // Array of a complex object type
          else {
            throw new Error("Complex object type arrays are not supported yet");
          }
        }
        // No array
        else {
          if (primitiveTypes.includes(this.payload.type)) {
            const primType = (this.payload.type === 'Integer' ? 'Int' : this.payload.type);
           return `bundle.get${primType}("${this.payload.name}")`;
          } else {
           return `${this.payload.type}.fromBundle(bundle)`;
          }
        }
      },
      // JAVA code to use for payload serialization (request payload / event payload)
      "payloadSerizalization": function() {
        // Array
        if (isArrayType(this.payload.type)) {
          const arrayType = getArrayType(this.payload.type);
          // Array of a primitive type
          if (primitiveTypes.includes(arrayType)) {
            let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
            return `new Bundle(); bundle.put${objType}Array("${this.payload.name}", \
                  ${this.payload.name});`;
          }
          // Array of a complex object type
          else {
            throw new Error("Complex object type arrays are not supported yet");
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
      "responsePayloadSerialization": function() {
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
      "responsePayloadDeserialization": function() {
        // Array
        if (isArrayType(this)) {
          const arrayType = getArrayType(this);
          // Array of a primitive type
          if (primitiveTypes.includes(arrayType)) {
            let objType = (arrayType === 'Integer' ? 'Int' : arrayType);
            return `bundle.get${objType}Array("rsp")`;
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
    }

    // Build composite final mustache view
    const mustacheView = Object.assign({}, config, commonView, javaView);

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

    //--------------------------------------------------------------------------
    // Optionally publish to npm
    //--------------------------------------------------------------------------
    if (shouldPublishToNpm) {
      log.info("== Publishing to NPM");
      shell.cd(`${outFolder}`);
      execSync(`npm publish`);
    }

    if(hasModelSchema()){
        initModelGen({
          javaModelDest: `${outFolder}/android/lib/src/main/java/${path}/${config.apiName}/model`,
          javaPackage: `${config.namespace}.${config.apiName.toLowerCase()}.model`,
          objCModelDest: `${outFolder}/ios/MODEL`
        })
    }

  } catch (e) {
    log.error('generateApiModule', e);
  }
}
//--------------------------------------------------------------------------
// Dirty hardcoded stuff
// As model generation is not yet included, just use a sample model for now
// to validate generated code can properly compile
// Keeping it here commented for reference until ern-model-gen is integrated.
//--------------------------------------------------------------------------

/*const sampleJavaModel = `package ${config.namespace}.${config.apiName}.model;

import android.os.Bundle;

public class LatLng {
  private float lat;
  private float lng;

  public LatLng(float lat, float lng) {
    this.lat = lat;
    this.lng = lng;
  }

  public float getLat() {
    return this.lat;
  }

  public float getLng() {
    return this.lng;
  }

  public static LatLng fromBundle(Bundle bundle) {
    return new LatLng(bundle.getFloat("lat"), bundle.getFloat("lng"));
  }

  public Bundle toBundle() {
    Bundle result = new Bundle();
    result.putFloat("lat", this.lat);
    result.putFloat("lng", this.lng);
    return result;
  }
}`;

shell.mkdir(`${outFolder}/android/lib/src/main/java/${path}/${config.apiName}/model`);
fs.writeFileSync(
  `${outFolder}/android/lib/src/main/java/${path}/${config.apiName}/model/LatLng.java`,
  sampleJavaModel,
  'utf-8');*/


import * as util from "./util.js"
import path from "path"
import Mustache from "mustache"
import chalk from "chalk"

const log = require('console-log-level')({
    prefix(level) {
        return '[ern-model-gen]'
    },
    level: 'info'
});

const BUILT_IN_OBJC_TYPES = [ "NSNumber *", "NSString *", "NSArray *", "BOOL", "id" ]

/**
 * Logic borrowed from api-gen
*/
const modelGenDir = path.join(__dirname, '..');

async function renderFileFromTemplate({ inputPath = "", outputPath = "", view = {} }) {
  const template = await util.readFile(path.resolve(process.cwd(), inputPath))
  const output = await Mustache.render(template, view)
  return util.writeFile(path.resolve(process.cwd(), outputPath), output)
}

async function generateModels(fileContents) {
  const { name, type, properties, required } = JSON.parse(fileContents)
  const rootModel = { [name]: { type, properties, required } }
  const views = generateViews({ model: rootModel, parent: null})
  await generateOutputDir();
  await generateSourceFromView(...views)
}

async function generateOutputDir() {
    await util.forceDeleteDir(DEFAULT_OUTPUT_DIR);
    await util.createDirIfDoesNotExist(objCOutput);
    await util.createDirIfDoesNotExist(javaOutput);
}

async function generateSourceFromView(view) {
  if (view.properties) {
    view.properties.forEach(async (property) => {
      if (property.properties) {
        return await generateSourceFromView(property)
      }
      return
    })
  }

  log.info(`Generating ${javaOutput}/${view.className}.java`);
  log.info(`Generating ${objCOutput}/${view.className}.h`);
  log.info(`Generating ${objCOutput}/${view.className}.m`);
  return Promise.all([
      renderFileFromTemplate({
          inputPath: `${modelGenDir}/templates/java/Model.java.mustache`,
          outputPath: `${javaOutput}/${view.className}.java`,
          view
      }),
     renderFileFromTemplate({
      inputPath: `${modelGenDir}/templates/Model.h.mustache`,
      outputPath: `${objCOutput}/${view.className}.h`,
      view
    }),
    renderFileFromTemplate({
      inputPath: `${modelGenDir}/templates/Model.m.mustache`,
      outputPath: `${objCOutput}/${view.className}.m`,
      view
    })
  ])
}

function generateViews({ model, parent, required , propertiesCount = 1}) {
  var models = Object.keys(model);
  return models.map((key) => {
    const { type } = model[key]
    let view = {
      name: lowercaseFirstLetter(key),
      className: capitalizeFirstLetter(key),
    }

    if (type.toLowerCase() === "object") {
      view = {
        ...view,
        type: `${capitalizeFirstLetter(key)} *`,
        javaType: view.className,
        customObject: true,
        properties: generateViews({
          model: model[key].properties,
          parent: view.name,
          required: model[key].required
        }),
        isRequired: (()=> {
            return findIsRequiredAndUpdateArray(required, view.name);
        })()
      }

      const importTypes = view.properties
        .filter(({ type }) => !BUILT_IN_OBJC_TYPES.includes(type))
        .map(({ name }) => capitalizeFirstLetter(name))

      if (importTypes.length > 0) {
        view = { ...view, importTypes }
      }

    } else {
      view = {
          ...view,
          ...valueObjectConversionProperties(type),
          type: objcTypeForJsonType(type),
          javaType: javaTypeForJsonType(type),
          customObject: false,
          isRequired: (() => {
              return findIsRequiredAndUpdateArray(required, view.name);
          })()
      }
    }

    if(model[key].description){
        view = {
            ...view,
            description:model[key].description
        }
    }

    //Check for the last required and last property inside a property.properties array
      view = {
          ...view,
          isLastRequiredItem:(() => {
              return (view.isRequired && required.length == 0);
          })(),
          lastItem:(() => {
              return (models.length == 1
              || propertiesCount == models.length);
          })()
      }

      propertiesCount++;

    if (parent) {
      view = { ...view, parent }
    }

    return Object.assign({}, view, androidViews, defaultViews);
  })
}

function findIsRequiredAndUpdateArray(requiredPropsList, key) {
    let val = requiredPropsList ? requiredPropsList.includes(key) : false
    if(val === true){
        let index = requiredPropsList.indexOf(key)
        if(index > -1) {
            requiredPropsList.splice(index, 1);
        }
    }
    return val;
}

function objcTypeForJsonType(jsonType) {
  switch (jsonType.toLowerCase()) {
    case "boolean": return "BOOL"
    case "string": return "NSString *"
    case "number": return "NSNumber *"
    case "integer": return "NSNumber *"
    case "array": return "NSArray *"
    default: return "id"
  }
}

function javaTypeForJsonType(jsonType) {
    switch (jsonType.toLowerCase()) {
        case "boolean": return "Boolean"
        case "string": return "String"
        case "number": return "Double"
        case "integer": return "Integer"
        case "array": return "List"
        default: return "Object"
    }
}
function valueObjectConversionProperties(jsonType) {
  switch (jsonType.toLowerCase()) {
    case "boolean": return {
      objectWrapperType: "NSNumber *",
      valueAccessorMessage: "boolValue",
      objectValueWrapperMessage: "[NSNumber numberWithBool: "
    }
    default: return {}
  }
}

function capitalizeFirstLetter(string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}

function lowercaseFirstLetter(string) {
  return `${string.charAt(0).toLowerCase()}${string.slice(1)}`;
}

const androidViews = {
    "classNameUpperCase": function () {
        return this.className.toUpperCase();
    },
    "package": function () {
        return `${javaPkg}`;
    },
    "getOptionalPropertyBuilder": function () {
        return getOptionalPropertyBuilder(this);
    },
     "getRequiredPropertyBuilder": function () {
        return getRequiredPropertyBuilder(this);
    },
    "setPropertyBuilder" : function () {
        return setPropertyBuilder(this);
    }
}

const defaultViews = {
    "classNameUpperCase": function () {
        return this.className.toUpperCase();
    }
}

let getOptionalPropertyBuilder = (view) => {
    return getPropertyBuilder(view, false);
}

let getRequiredPropertyBuilder = (view) => {
    return getPropertyBuilder(view, true);
}

function getPropertyBuilder(view, required){
    if (view.customObject) {
        return required 
                ? `${view.className}.fromBundle(` + getBundle(view) + `)`
                : `bundle.containsKey("${view.name}") ? new ${view.className}(` + getBundle(view) + `) : null`;
    } else{
        switch (view.javaType) {
            case 'Boolean':
                return required
                    ? getBundle(view)
                    : `bundle.containsKey("${view.name}") ? ` + getBundle(view) + ` : null`
            case 'String':
                return required
                    ? getBundle(view)
                    : `bundle.containsKey("${view.name}") ? ` + getBundle(view) + ` : null`;
            case 'Integer':
                return getBundle(view);
            case 'Double':
                return required
                    ? getBundle(view)
                    : `bundle.containsKey("${view.name}") ? ` + getBundle(view) + ` : null`;
        }
    }
}

function getBundle(view){
    const complexBundle = `bundle.getBundle("${view.name}")`;
    const intBundle = `getIntegerValue(bundle, "${view.name}") == null ? null : getIntegerValue(bundle, "${view.name}").intValue()`;
    const boolBundle = `bundle.getBoolean("${view.name}")`;
    const strBundle = `bundle.getString("${view.name}")`;
    const doubleBundle = `bundle.getDouble("${view.name}")`;

    if (view.customObject) {
        return complexBundle;
    } else{
        switch (view.javaType) {
            case 'Boolean':
                return boolBundle;
            case 'String':
                return strBundle;
            case 'Integer':
                return intBundle;
            case 'Double':
                return doubleBundle;
        }
    }
}

let setPropertyBuilder = (view) => {
    if (view.customObject) {
        return `bundle.putParcelable("${view.name}", ${view.name}.toBundle())`;
    } else {
        switch (view.javaType) {
            case 'Boolean':
                return `bundle.putBoolean("${view.name}", ${view.name})`;
            case 'String':
                return `bundle.putString("${view.name}", ${view.name})`;
            case 'Integer':
                return `bundle.putInt("${view.name}", ${view.name})`;
            case 'Double':
                return `bundle.putDouble("${view.name}", ${view.name})`;
        }
    }
}

const DEFAULT_OUTPUT_DIR = 'output'
const DEFAULT_OUTPUT_DIR_IOS = DEFAULT_OUTPUT_DIR + '/ios'
const DEFAULT_OUTPUT_DIR_ANDROID = DEFAULT_OUTPUT_DIR  +'/android/com/walmartlabs/ern/model'
const DEFAULT_JAVA_PACKAGE = 'com.walmartlabs.ern.model'
const DEFAULT_SCHEMA_PATH = path.resolve(process.cwd(), 'schema.json')

let objCOutput;
let javaOutput;
let javaPkg;

export default async function runModelGen({
    javaModelDest = DEFAULT_OUTPUT_DIR_ANDROID,
    objCModelDest = DEFAULT_OUTPUT_DIR_IOS,
    javaPackage = DEFAULT_JAVA_PACKAGE,
    schemaPath = DEFAULT_SCHEMA_PATH
  } = {}) {

  javaOutput = javaModelDest;
  objCOutput = objCModelDest;
  javaPkg = javaPackage;

  console.log(chalk.blue("Models generation, in progress......."))

  try {
    const modelSchema = await util.readFile(schemaPath)
    await generateModels(modelSchema)
    console.log(chalk.green("Models are generated"))

  } catch (error) {
    console.log(chalk.red("There was an error generating models: " + error))
    console.error(error)
  }
}

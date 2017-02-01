
import * as util from "./util.js"
import path from "path"
import minimist from "minimist"
import Mustache from "mustache"
import fs from "fs-extra"
import chalk from "chalk"

const BUILT_IN_OBJC_TYPES = [ "NSNumber *", "NSString *", "NSArray *", "BOOL", "id" ]
const OUTPUT_DIR = 'output'
const OUTPUT_DIR_IOS = OUTPUT_DIR + '/ios'
const OUTPUT_DIR_ANDROID = OUTPUT_DIR  +'/android/com/walmartlabs/ern/model'

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
    await util.forceDeleteDir(OUTPUT_DIR);
    await util.createDirIfDoesNotExist(OUTPUT_DIR_IOS);
    await util.createDirIfDoesNotExist(OUTPUT_DIR_ANDROID);
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

  return Promise.all([
      renderFileFromTemplate({
          inputPath: "templates/java/Model.java.mustache",
          outputPath: OUTPUT_DIR_ANDROID + `/${view.className}.java`,
          view
      }),
    renderFileFromTemplate({
      inputPath: "templates/Model.h.mustache",
      outputPath: OUTPUT_DIR_IOS + `/${view.className}.h`,
      view
    }),
    renderFileFromTemplate({
      inputPath: "templates/Model.m.mustache",
      outputPath: OUTPUT_DIR_IOS + `/${view.className}.m`,
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

    return Object.assign({}, view, defaultAndroidViews);
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
        case "number": return "Integer"
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

const defaultAndroidViews = {
    "parcelableReadGetter": function () {
        return parcelableReadGetter(this)
    },
    "parcelableWriteSetter": function () {
        return parcelableWriteSetter(this)
    }
}

let parcelableReadGetter = (view) => {
    if (view.customObject) {
        return `readParcelable(${view.className}.class.getClassLoader())`;
    } else {
        switch (view.javaType) {
            case 'Boolean':
                return `readInt() != 0`;
            case 'String':
                return `readString()`;
            case 'Integer':
                return `readInt()`;
        }
    }
}

let parcelableWriteSetter = (view) => {
    if (view.customObject) {
        return `writeParcelable(${view.name}, flags)`;
    } else {
        switch (view.javaType) {
            case 'Boolean':
                return `writeInt(${view.name } ? 1 : 0)`;
            case 'String':
                return `writeString(${view.name})`;
            case 'Integer':
                return `writeInt(${view.name})`;
        }
    }
}

export default async function initModelGen() {
  console.log(chalk.blue("Models generation, in progress......."))
  const argv = minimist(process.argv.slice(2))
  const { schema = "schema.json" } = argv
  const schemaPath = path.resolve(process.cwd(), schema)

  try {
    const json = await util.readFile(schemaPath)
    await generateModels(json)
    console.log(chalk.green("Models are generated"))

  } catch (error) {
    console.log(chalk.red("There was an error generating models: " + error))
    console.error(error)
  }
}

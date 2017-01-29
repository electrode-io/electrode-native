
import * as util from "./util.js"
import path from "path"
import minimist from "minimist"
import Mustache from "mustache"
import fs from "fs-extra"
import chalk from "chalk"

const BUILT_IN_TYPES = [ "NSNumber *", "NSString *", "NSArray *", "BOOL", "id" ]
const OUTPUT_DIR = 'output'
const OUTPUT_DIR_IOS = OUTPUT_DIR + '/ios'
const OUTPUT_DIR_ANDROID = OUTPUT_DIR  +'/android'

async function renderFileFromTemplate({ inputPath = "", outputPath = "", view = {} }) {
  const template = await util.readFile(path.resolve(process.cwd(), inputPath))
  const output = await Mustache.render(template, view)
  return util.writeFile(path.resolve(process.cwd(), outputPath), output)
}

async function generateModels(fileContents) {
  const json = JSON.parse(fileContents)
  const { name, type, properties } = JSON.parse(fileContents)
  const rootModel = { [name]: { type, properties } }
  const views = generateViews({ model: rootModel, parent: null })
  await generateOutputDir();
  await generateSourceFromView(...views)
}

async function generateOutputDir() {
  util.forceDeleteDir(OUTPUT_DIR);
  util.createDirIfDoesNotExist(OUTPUT_DIR);
  util.createDirIfDoesNotExist(OUTPUT_DIR_IOS);
  util.createDirIfDoesNotExist(OUTPUT_DIR_ANDROID);
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

function generateViews({ model, parent }) {
  return Object.keys(model).map((key) => {
    const { type } = model[key]
    let view = {
      name: lowercaseFirstLetter(key),
      className: capitalizeFirstLetter(key)
    }

    if (type.toLowerCase() === "object") {
      view = {
        ...view,
        type: `${capitalizeFirstLetter(key)} *`,
        customObject: true,
        properties: generateViews({
          model: model[key].properties,
          parent: view.name
        })
      }

      const importTypes = view.properties
        .filter(({ type }) => !BUILT_IN_TYPES.includes(type))
        .map(({ name }) => capitalizeFirstLetter(name))

      if (importTypes.length > 0) {
        view = { ...view, importTypes }
      }

    } else {
      view = {
        ...view,
        ...valueObjectConversionProperties(type),
        type: objcTypeForJsonType(type),
        customObject: false
      }
    }

    if (parent) {
      view = { ...view, parent }
    }

    if (view.properties) {
      const [ last, ...props ] = view.properties.reverse()
      view = {
        ...view,
        properties: [
          ...(props.map((prop) => ({ ...prop, lastItem: false }))),
          { ...last, lastItem: true }
        ]
      }
    }

    return view
  })
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

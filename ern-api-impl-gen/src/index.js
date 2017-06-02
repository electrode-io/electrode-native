// @flow
import fs from 'fs'
import chalk from 'chalk'
import shell from 'shelljs'

import {
  Platform,
  yarn,
  spin
} from '@walmart/ern-util'

const {yarnAdd, yarnInstall} = yarn

const WORKING_FOLDER = `${Platform.rootDirectory}/api-impl-gen`
const PLUGIN_FOLDER = `${WORKING_FOLDER}/plugins`
const OUT_FOLDER = `${WORKING_FOLDER}/out`

export async function generateApiImpl ({
                                         apiName,
                                         outputFolder,
                                         nativeOnly
                                       }: {
  apiName: string,
  outputFolder: string,
  nativeOnly: boolean
} = {}) {
  console.log('Entering generate API IMPL')

  if (!outputFolder) {
    outputFolder = `${shell.pwd()}/${apiName}-impl`
  }

  if (fs.existsSync(outputFolder)) {
    log.warn(chalk.red(`An implementation directory already exists: ${outputFolder}`))
    process.exit(1)
  }

  // Folder from which api-impl-gen is executed.

  // Creates a working folder to collect all the necessary files/folders for the api-impl generation.
  await createWorkingFolder()

  // npm install the api code, this will be copied over to the generated project
  await downloadApi(apiName)

  // Generate the final project
  await fillHull(outputFolder, apiName, nativeOnly)

  // Copy the final content from working directory here
  log.info(chalk.green(`${outputFolder} is generated for api: ${apiName}`))
}

async function createWorkingFolder () {
  shell.rm('-rf', WORKING_FOLDER)
  shell.mkdir('-p', PLUGIN_FOLDER)
  shell.mkdir('-p', OUT_FOLDER)
}

async function fillHull (outputFolder, apiName, nativeOnly) {
  try {
    shell.mkdir(outputFolder)
    if (nativeOnly) {
      await spin(`generating android project`, fillHullAndroid(outputFolder, apiName))
      await fillHullIos(outputFolder, apiName)
    } else {
      console.log(chalk.yellow(`TODO: Generate JS only project.`))
    }
  } catch (e) {
    log.error(`error while filling api-impl-gen hull: ${e}`)
  }
}

function fillHullAndroid (outputFolder, apiName) {
  return new Promise((resolve, reject) => {
    resolve(() => {
      console.log(`[=== Starting api-impl-gen hull filling ===]`)
      const androidFolder = `${outputFolder}/android`
      shell.mkdir(androidFolder)
      console.log(`Creating out folder and copying api-impl-gen Hull to it`)
      shell.cp(`-R`, `${Platform.currentPlatformVersionPath}/ern-api-impl-gen/hull/android/*`, `${androidFolder}`)

      console.log(`copying api code`)
      shell.cp(`-R`, `${WORKING_FOLDER}/out/node_modules/${apiName}/android/lib/*`, `${androidFolder}/lib/`)
    })
  })
}

function fillHullIos (outputFolder, apiName) {
  log.warn(chalk.yellow(`TODO: generate IOS impl project`))
}

async function downloadApi (apiName) {
  shell.cd(OUT_FOLDER)
  await yarnAdd(apiName)
  await spin(`yarn installing ${apiName}`, yarnInstall())
}

// @flow

import fs from 'fs'
import shell from 'shelljs'
import inquirer from 'inquirer'

import {
  Dependency,
  DependencyPath,
  Utils
} from 'ern-util'
import {
  ModuleTypes,
  yarn
} from 'ern-core'

import ApiImplGen from './generators/ApiImplGen'

const API_NAME_RE = /([^/]*)$/

const path = require('path')

export async function generateApiImpl ({
  apiDependencyPath,
  outputFolder,
  nativeOnly,
  forceGenerate,
  reactNativeVersion,
  paths
} : {
  apiDependencyPath: DependencyPath,
  outputFolder: string,
  nativeOnly: boolean,
  forceGenerate: boolean,
  reactNativeVersion: string,
  paths: {
    workingFolder: string,
    pluginsDownloadFolder: string,
    apiImplHull: string,
    outFolder: string
  }
} = {}) {
  log.debug('Entering generate API IMPL')

  try {
    // get the folder to output the generated project.
    paths.outFolder = outputFolder = formOutputFolderName(apiDependencyPath, outputFolder)
    await createOutputFolder(outputFolder, forceGenerate)
    await createNodePackage(outputFolder, apiDependencyPath, nativeOnly)

    let platforms = getPlatforms(nativeOnly)

    // Creates a working folder to collect all the necessary files/folders for the api-impl generation.
    createWorkingFolder(paths.workingFolder)
    createPluginsDownloadFolder(paths.pluginsDownloadFolder)

    await new ApiImplGen().generateApiImplementation(apiDependencyPath, paths, reactNativeVersion, platforms)
  } catch (e) {
    log.debug('command failed performing cleanup.')
    throw new Error(e)
  }
}

async function createOutputFolder (outputFolderPath: string, forceGenerate) {
  if (!forceGenerate && fs.existsSync(outputFolderPath)) {
    const {shouldRegenerate} = await inquirer.prompt(
      {
        type: `confirm`,
        name: `shouldRegenerate`,
        message: `An implementation directory already exists in ${outputFolderPath}. Do you want to delete this and regenerate this project?`,
        default: false
      }
    )

    if (!shouldRegenerate) {
      throw Error(`An implementation directory already exists`)
    } else {
      forceGenerate = true
    }
  }

  if (forceGenerate && fs.existsSync(outputFolderPath)) {
    log.info(`Deleting the existing directory and recreating a new one in ${outputFolderPath}`)
    shell.rm('-R', outputFolderPath)
  } else {
    log.debug(`creating output dir: ${outputFolderPath}`)
  }
  shell.mkdir('-p', outputFolderPath)
  Utils.throwIfShellCommandFailed()
}

async function createNodePackage (
  outputFolderPath: string,
  apiDependencyPath: DependencyPath,
  nativeOnly: boolean) {
  let currentFolder = shell.pwd()
  shell.cd(outputFolderPath)
  await yarn.init()
  await yarn.add(apiDependencyPath)
  shell.rm('-rf', `${outputFolderPath}/node_modules/`)
  Utils.throwIfShellCommandFailed()
  log.debug('Removed node modules folder')
  const packageJsonPath = path.join(outputFolderPath, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const moduleType = nativeOnly ? `${ModuleTypes.NATIVE_API_IMPL}` : `${ModuleTypes.JS_API_IMPL}`
  packageJson.ern = {
    moduleType
  }
  packageJson.keywords
    ? packageJson.keywords.push(moduleType)
    : packageJson.keywords = [moduleType]
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  shell.cd(currentFolder)
}

function createWorkingFolder (workingFolderPath: string) {
  shell.rm('-rf', workingFolderPath)
  shell.mkdir('-p', workingFolderPath)
  log.debug(`Working folder created: ${workingFolderPath}`)
}

function createPluginsDownloadFolder (pluginsDownloadPath: string) {
  shell.rm('-rf', pluginsDownloadPath)
  shell.mkdir('-p', pluginsDownloadPath)
}

function formOutputFolderName (apiDependencyPath, outputFolderPath: string) {
  let apiDependencyObj = Dependency.fromPath(apiDependencyPath)
  let apiName = API_NAME_RE.exec(apiDependencyObj.name)[1]

  return outputFolderPath
    ? path.join(`${outputFolderPath}`, `${apiName}-impl`)
    : path.join(`${shell.pwd()}`, `${apiName}-impl`)
}

function getPlatforms (nativeOnly: boolean): Array<string> {
  return nativeOnly
    ? [`android`, `ios`]
    : [`js`]
}

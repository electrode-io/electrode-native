// @flow

import fs from 'fs'
import inquirer from 'inquirer'

import {
  Dependency,
  shell
} from 'ern-util'
import {
  ModuleTypes,
  yarn
} from 'ern-core'

import ApiImplGen from './generators/ApiImplGen'

const API_NAME_RE = /([^/]*)$/

const path = require('path')

export async function generateApiImpl ({
  apiDependency,
  outputDirectory,
  nativeOnly,
  forceGenerate,
  reactNativeVersion,
  hasConfig = false,
  paths
} : {
  apiDependency: Dependency,
  outputDirectory: string,
  nativeOnly: boolean,
  forceGenerate: boolean,
  reactNativeVersion: string,
  hasConfig: boolean,
  paths: {
    workingDirectory: string,
    pluginsDownloadDirectory: string,
    apiImplHull: string,
    outDirectory: string
  }
} = {}) {
  log.debug('Entering generate API IMPL')

  try {
    // get the directory to output the generated project.
    paths.outDirectory = outputDirectory = formOutputDirectoryName(apiDependency, outputDirectory)
    await createOutputDirectory(outputDirectory, forceGenerate)
    await createNodePackage(outputDirectory, apiDependency, nativeOnly, hasConfig)

    let platforms = getPlatforms(nativeOnly)

    // Creates a working directory to collect all the necessary files/directories for the api-impl generation.
    createWorkingDirectory(paths.workingDirectory)
    createPluginsDownloadDirectory(paths.pluginsDownloadDirectory)

    await new ApiImplGen().generateApiImplementation(apiDependency, paths, reactNativeVersion, platforms)
  } catch (e) {
    log.debug('command failed performing cleanup.')
    throw new Error(e)
  }
}

async function createOutputDirectory (outputDirectoryPath: string, forceGenerate) {
  if (!forceGenerate && fs.existsSync(outputDirectoryPath)) {
    const {shouldRegenerate} = await inquirer.prompt(
      {
        type: `confirm`,
        name: `shouldRegenerate`,
        message: `An implementation directory already exists in ${outputDirectoryPath}. Do you want to delete this and regenerate this project?`,
        default: false
      }
    )

    if (!shouldRegenerate) {
      throw Error(`An implementation directory already exists`)
    } else {
      forceGenerate = true
    }
  }

  if (forceGenerate && fs.existsSync(outputDirectoryPath)) {
    log.info(`Deleting the existing directory and recreating a new one in ${outputDirectoryPath}`)
    shell.rm('-R', outputDirectoryPath)
  } else {
    log.debug(`creating output dir: ${outputDirectoryPath}`)
  }
  shell.mkdir('-p', outputDirectoryPath)
}

async function createNodePackage (
  outputDirectoryPath: string,
  apiDependency: Dependency,
  nativeOnly: boolean,
  hasConfig: boolean) {
  let currentDirectory = process.cwd()
  shell.cd(outputDirectoryPath)
  await yarn.init()
  await yarn.add(apiDependency.path)
  shell.rm('-rf', path.join(outputDirectoryPath, 'node_modules'))
  ernifyPackageJson(outputDirectoryPath, nativeOnly, hasConfig)
  shell.cd(currentDirectory)
}

function createWorkingDirectory (workingDirectoryPath: string) {
  shell.rm('-rf', workingDirectoryPath)
  shell.mkdir('-p', workingDirectoryPath)
  log.debug(`Working directory created: ${workingDirectoryPath}`)
}

function createPluginsDownloadDirectory (pluginsDownloadPath: string) {
  shell.rm('-rf', pluginsDownloadPath)
  shell.mkdir('-p', pluginsDownloadPath)
}

function formOutputDirectoryName (apiDependency: Dependency, outputDirectoryPath: string) {
  let apiName = API_NAME_RE.exec(apiDependency.name)[1]
  return outputDirectoryPath
    ? path.join(outputDirectoryPath, `${apiName}-impl`)
    : path.join(process.cwd(), `${apiName}-impl`)
}

function getPlatforms (nativeOnly: boolean): Array<string> {
  return nativeOnly
    ? [`android`, `ios`]
    : [`js`]
}

function ernifyPackageJson (outputDirectoryPath, nativeOnly, hasConfig) {
  const packageJsonPath = path.join(outputDirectoryPath, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const moduleType = nativeOnly ? `${ModuleTypes.NATIVE_API_IMPL}` : `${ModuleTypes.JS_API_IMPL}`
  const containerGen = {
    'hasConfig': hasConfig
  }
  packageJson.ern = {
    moduleType,
    containerGen
  }
  packageJson.keywords
    ? packageJson.keywords.push(moduleType)
    : packageJson.keywords = [moduleType]
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

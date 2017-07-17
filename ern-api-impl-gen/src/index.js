// @flow

import fs from 'fs'
import shell from 'shelljs'

import {
  Dependency,
  DependencyPath,
  Utils,
  yarn
} from '@walmart/ern-util'

import ApiImplGen from './generators/ApiImplGen'

const API_NAME_RE = /([^/]*)$/

const path = require('path')

const {yarnInit, yarnAdd} = yarn

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
    pluginsConfigPath: string,
    apiImplHull: string,
    reactNativeAarsPath: string,
    outFolder: string
  }
} = {}) {
  log.debug('Entering generate API IMPL')

  try {
    // get the folder to output the generated project.
    paths.outFolder = outputFolder = formOutputFolderName(apiDependencyPath, outputFolder)
    createOutputFolder(outputFolder, forceGenerate)
    createNodePackage(outputFolder, apiDependencyPath)

    let platforms = getPlatforms(nativeOnly)

    // Creates a working folder to collect all the necessary files/folders for the api-impl generation.
    createWorkingFolder(paths.workingFolder)
    createPluginsDownloadFolder(paths.pluginsDownloadFolder)

    await new ApiImplGen().generateApiImplementation(apiDependencyPath, paths, reactNativeVersion, platforms)
  } catch (e) {
    Utils.logErrorAndExitProcess(`Unable to start project generation: ${e}`)
  }
}

function createOutputFolder (outputFolderPath: string, forceGenerate) {
  if (!forceGenerate && fs.existsSync(outputFolderPath)) {
    Utils.logErrorAndExitProcess(`An implementation directory already exists: ${outputFolderPath}. \nIf you want to force create this project use -f option in your command.`)
    // RETURN
  } else {
    if (forceGenerate && fs.existsSync(outputFolderPath)) {
      log.info(`Deleting the existing folder and recreating a new output folder" ${outputFolderPath}`)
      shell.rm('-R', outputFolderPath)
    }
    shell.mkdir('-p', outputFolderPath)
    Utils.throwIfShellCommandFailed()
  }
}

async function createNodePackage (outputFolderPath: string, apiDependencyPath: DependencyPath) {
  let currentFolder = shell.pwd()
  shell.cd(outputFolderPath)
  yarnInit()
  yarnAdd(apiDependencyPath).then(() => {
    shell.rm('-rf', `${outputFolderPath}/node_modules/`)
    Utils.throwIfShellCommandFailed()
    log.debug('Deleted node modules folder')
  })
  shell.cd(currentFolder)
}

function createWorkingFolder (workingFolderPath: string) {
  shell.rm('-rf', workingFolderPath)
  shell.mkdir('-p', workingFolderPath)
}

function createPluginsDownloadFolder (pluginsDownloadPath: string) {
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

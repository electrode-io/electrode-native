// @flow
import fs from 'fs'
import shell from 'shelljs'

import {
  Dependency,
  Utils
} from '@walmart/ern-util'

import ApiImplGen from './generators/ApiImplGen'

const API_NAME_RE = /([^/]*)$/

// Contains all interesting folders paths
const paths = {}

export async function generateApiImpl ({
  api,
  outputFolder,
  nativeOnly,
  forceGenerate,
  platformPath,
  workingFolder
} : {
  api: string, // Can be an npm package, git repo link or a file location.
  outputFolder: string,
  nativeOnly: boolean,
  forceGenerate: boolean,
  platformPath: string,
  workingFolder: string
} = {}) {
  console.log('Entering generate API IMPL')

  paths.platformPath = platformPath

  // get the folder to output the generated project.
  paths.outFolder = outputFolder = formOutputFolderName(api, outputFolder)

  // Where the container project hull is stored
  paths.apiImplHull = `${platformPath}/ern-api-impl-gen/hull`

  // Where the container generation configuration of all plugins is stored
  paths.pluginsConfig = `${platformPath}/ern-container-gen/plugins`

  // Where we download plugins
  paths.pluginsDownloadFolder = `${workingFolder}/plugins`

  try {
    createOutputFolder(forceGenerate, outputFolder)

    let platforms = getPlatforms(nativeOnly)

    // Creates a working folder to collect all the necessary files/folders for the api-impl generation.
    await createWorkingFolder(workingFolder)

    await new ApiImplGen().generateApiImplementation(api, paths, platforms)
  } catch (e) {
    Utils.logErrorAndExitProcess(`Unable to start project generation: ${e}`)
  }
}

function createOutputFolder (forceGenerate, outputFolder) {
  if (!forceGenerate && fs.existsSync(outputFolder)) {
    Utils.logErrorAndExitProcess(`An implementation directory already exists: ${outputFolder}. \nIf you want to force create this project use -f option in your command.`)
    // RETURN
  } else {
    if (forceGenerate && fs.existsSync(outputFolder)) {
      log.info(`Deleting the existing folder and recreating a new output folder" ${outputFolder}`)
      shell.rm('-R', outputFolder)
    }
    shell.mkdir('-p', outputFolder)
    Utils.throwIfShellCommandFailed()
  }
}

async function createWorkingFolder (path: string) {
  shell.rm('-rf', path)
  shell.mkdir('-p', `${path}/plugins`)
}

function formOutputFolderName (api, outputFolder) {
  let apiDependencyObj = Dependency.fromString(api)
  let apiName = API_NAME_RE.exec(apiDependencyObj.name)[1]

  if (!outputFolder) {
    outputFolder = `${shell.pwd()}/${apiName}-impl`
  } else {
    outputFolder = `${outputFolder}/${apiName}-impl`
  }

  return outputFolder
}

function getPlatforms (nativeOnly: boolean): Array<string> {
  if (nativeOnly) {
    return [`android`, `ios`]
  } else {
    return [`js`]
  }
}

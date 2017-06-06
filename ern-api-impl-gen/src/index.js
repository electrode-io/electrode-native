// @flow
import fs from 'fs'
import shell from 'shelljs'

import {
  Platform,
  Dependency,
  Utils
} from '@walmart/ern-util'

import ApiImplGen from './generators/ApiImplGen'

const WORKING_FOLDER = `${Platform.rootDirectory}/api-impl-gen`
const PLUGIN_FOLDER = `${WORKING_FOLDER}/plugins`

const platformPath = `${Platform.currentPlatformVersionPath}`

// Contains all interesting folders paths
const paths = {}

// Where the container project hull is stored
paths.apiImplHull = `${platformPath}/ern-api-impl-gen/hull`

// Where the container generation configuration of all plugins is stored
paths.pluginsConfig = `${platformPath}/ern-container-gen/plugins`

// Where we download plugins
paths.pluginsDownloadFolder = PLUGIN_FOLDER

paths.platformPath = platformPath

export async function generateApiImpl ({
                                         api,
                                         outputFolder,
                                         nativeOnly
                                       }: {
  api: string, // Can be an npm package, git repo link or a file location.
  outputFolder: string,
  nativeOnly: boolean
} = {}) {
  console.log('Entering generate API IMPL')

  // get the folder to output the generated project.
  paths.outFolder = formOutputFolderName(api, outputFolder)

  if (fs.existsSync(outputFolder)) {
    Utils.logErrorAndExitProcess(`An implementation directory already exists: ${outputFolder}`)
    // RETURN
  }

  let platforms = getPlatforms(nativeOnly)

  // Creates a working folder to collect all the necessary files/folders for the api-impl generation.
  await createWorkingFolder()

  new ApiImplGen().generateApiImplementation(api, paths, platforms)
}

async function createWorkingFolder () {
  shell.rm('-rf', WORKING_FOLDER)
  shell.mkdir('-p', PLUGIN_FOLDER)
}

function formOutputFolderName (api, outputFolder) {
  let apiDependencyObj = Dependency.fromString(api)

  if (!outputFolder) {
    outputFolder = `${shell.pwd()}/${apiDependencyObj.name}-impl`
  } else {
    outputFolder = `${outputFolder}/${apiDependencyObj.name}-impl`
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

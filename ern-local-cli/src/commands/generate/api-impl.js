// @flow

import {
  generateApiImpl
} from '@walmart/ern-api-impl-gen'

import {
  Platform
} from '@walmart/ern-util'

import Manifest from '../../lib/Manifest'

exports.command = 'api-impl <api>'
exports.desc = 'Commands to generate API implementation skeleton.'

exports.builder = function (yargs: any) {
  return yargs.option('api', {
    type: 'string',
    describe: `npm package name OR the git location of the api f OR the file path for which an implementation needs to be generated.`
  }).option('nativeOnly', {
    alias: 'n',
    type: 'bool',
    describe: 'Generate native projects with proper dependencies (Implementation of the API has to be written in native'
  }).option('force', {
    alias: 'f',
    type: 'bool',
    describe: 'Forces a project creation even if an imlemenation already present inside the output location'
  }).option('outputFolder', {
    alias: 'o',
    describe: 'Path to output folder'
  })
}

const WORKING_FOLDER = `${Platform.rootDirectory}/api-impl-gen`
const PLUGIN_FOLDER = `${WORKING_FOLDER}/plugins`
const platformPath = `${Platform.currentPlatformVersionPath}`

// Contains all interesting folders paths
const paths = {}

paths.platformPath = platformPath

// Where the container project hull is stored
paths.apiImplHull = `${platformPath}/ern-api-impl-gen/hull`

paths.reactNativeAarsPath = `${Platform.manifestDirectory}/react-native_aars`

// Where the container generation configuration of all plugins is stored
paths.pluginsConfigPath = Platform.pluginsConfigurationDirectory

// Where we download plugins
paths.pluginsDownloadFolder = PLUGIN_FOLDER

// Placeholder for all the downloads needed for generating an impl project.
paths.workingFolder = WORKING_FOLDER

exports.handler = async function ({
  api,
  nativeOnly,
  force,
  outputFolder
} : {
  api: string,
  nativeOnly: boolean,
  force: boolean,
  outputFolder: string,
}) {
  console.log(`command identified for generating API implementation for  ${api}`)
  paths.reactNativeVersion = await Manifest.getReactNativeVersionFromManifest()

  generateApiImpl({
    api,
    outputFolder,
    nativeOnly,
    forceGenerate: force,
    paths: paths
  })
}

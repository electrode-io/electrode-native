// @flow

import {
  generateApiImpl
} from '@walmart/ern-api-impl-gen'

import {
  Platform
} from '@walmart/ern-util'

import Manifest from '../../lib/Manifest'

const path = require('path')

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

const WORKING_FOLDER = path.join(Platform.rootDirectory, `api-impl-gen`)
const PLUGIN_FOLDER = path.join(WORKING_FOLDER, `plugins`)
const platformPath = `${Platform.currentPlatformVersionPath}`

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

  let reactNativeVersion = await Manifest.getReactNativeVersionFromManifest()
  if (!reactNativeVersion) {
    return log.error('Could not retrieve react native version from manifest')
  }

  await generateApiImpl({
    api,
    outputFolder,
    nativeOnly,
    forceGenerate: force,
    reactNativeVersion,
    paths: {
      apiImplHull: path.join(platformPath, `ern-api-impl-gen/hull`),
      reactNativeAarsPath: path.join(Platform.manifestDirectory, `react-native_aars`),
      pluginsConfigPath: `${Platform.pluginsConfigurationDirectory}`,
      pluginsDownloadFolder: PLUGIN_FOLDER,
      workingFolder: WORKING_FOLDER,
      outFolder: ''
    }
  })
}

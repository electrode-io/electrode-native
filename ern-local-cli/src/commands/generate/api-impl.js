// @flow

import {
  generateApiImpl
} from '@walmart/ern-api-impl-gen'

import {
  Platform
} from '@walmart/ern-util'

import Manifest from '../../lib/Manifest'
import inquirer from 'inquirer'

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
  }).option('jsOnly', {
    alias: 'j',
    type: 'bool',
    describe: 'Generate js project with proper dependencies (Implementation of the API has to be written in js'
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
  jsOnly,
  force,
  outputFolder
} : {
  api: string,
  nativeOnly: boolean,
  jsOnly: boolean,
  force: boolean,
  outputFolder: string,
}) {
  console.log(`command identified for generating API implementation for  ${api}`)

  let reactNativeVersion = await Manifest.getReactNativeVersionFromManifest()
  if (!reactNativeVersion) {
    return log.error('Could not retrieve react native version from manifest')
  }

  if (jsOnly && nativeOnly) {
    log.warn('Looks like both js and native are selected, should be only one')
    nativeOnly = await promptPlatformSelection()
  }

  if (!jsOnly && !nativeOnly) {
    nativeOnly = await promptPlatformSelection()
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

async function promptPlatformSelection () {
  return inquirer.prompt([{
    type: 'list',
    name: 'targetPlatform',
    message: `Choose a platform that you are planning to write this api implementation in?`,
    default: `js`,
    choices: [`js`, `native`]
  }]).then((answers) => {
    return answers.targetPlatform !== `js`
  })
}

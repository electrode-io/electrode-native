import { reactNative } from '@walmart/ern-util'

// Node
import child_process from 'child_process'
import fs from 'fs'
import http from 'http'
import path from 'path'
import shell from 'shelljs'
import Ora from 'ora'
import xcode from '@walmart/xcode-ern'
import _ from 'lodash'

import {
  capitalizeFirstLetter
} from './utils.js'

const exec = child_process.exec
const execSync = child_process.execSync
// 3rd party

let mustacheView = {}
let containerBaseManifest

const ROOT_DIR = shell.pwd()
const gitFolderRe = /.*\/(.*).git/
const npmScopeModuleRe = /(@.*)\/(.*)/
const npmModuleRe = /(.*)@(.*)/
const fileRe = /^file:\/\//

const DEFAULT_NAMESPACE = 'com.walmartlabs.ern'
const DEFAULT_MAVEN_REPO_URL = `file://${process.env['HOME']}/.m2/repository`

// Path to ern platform root folder
const ERN_PATH = `${process.env['HOME']}/.ern`

let log

//=============================================================================
// ern-container-gen entry point
//=============================================================================

// generator: The generator to use along with its config
//  ex :
//  {
//    platform: "android",
//    name: "maven",
//    containerVersion: "1.2.3",
//    mavenRepositoryUrl = ...
//  }
// plugins: Array containing all plugins to be included in the container
//  ex :
//  [{ name: "react-native", version: "0.40.0"}, {name: "react-native-code-push"}]
// miniApps: Array of mini apps to be included in the container
//  ex :
//  [
//    {
//      name: "RnDemoApp",
//      version: "1.0.0"
//    }
//  ]
export default async function generateContainer({
  containerVersion = required('containerVersion'),
  nativeAppName = required('nativeAppName'),
  platformPath = required('platformPath'),
  generator = required('generator'),
  plugins = [],
  miniapps = [],
  verbose
} = {}) {
  log = require('console-log-level')({
      prefix: () => '[ern-container-gen]',
      level: verbose ? 'info' : 'warn'
  })

  if (!generator.generateContainer) {
    throw new Error("The generator miss a generateContainer function !")
  }

  // Folder from which container gen is run from
  const WORKING_FOLDER = `${ERN_PATH}/containergen`
  // Folder from which we download all plugins sources (from npm or git)
  const PLUGINS_DOWNLOAD_FOLDER = `${WORKING_FOLDER}/plugins`
  // Folder where the resulting container project is stored in
  const OUT_FOLDER = `${WORKING_FOLDER}/out`
  // Folder from which we assemble the miniapps together / run the bundling
  const COMPOSITE_MINIAPP_FOLDER = `${WORKING_FOLDER}/compositeMiniApp`

  // Contains all interesting folders paths
  const paths = {
    // Where the container project hull is stored
    containerHull: `${platformPath}/ern-container-gen/hull`,
    // Where the container generation configuration of all plugins is stored
    containerPluginsConfig: `${platformPath}/ern-container-gen/plugins`,
    // Where the templates to be used during container generation are stored
    containerTemplates: `${platformPath}/ern-container-gen/templates`,
    // Where we assemble the miniapps together
    compositeMiniApp: COMPOSITE_MINIAPP_FOLDER,
    // Where we download plugins
    pluginsDownloadFolder: PLUGINS_DOWNLOAD_FOLDER,
    // Where we output final generated container
    outFolder: OUT_FOLDER
  }

    // Clean up to start fresh
  shell.rm('-rf', PLUGINS_DOWNLOAD_FOLDER)
  shell.rm('-rf', OUT_FOLDER)
  shell.rm('-rf', COMPOSITE_MINIAPP_FOLDER)
  shell.mkdir('-p', PLUGINS_DOWNLOAD_FOLDER)
  shell.mkdir('-p', `${OUT_FOLDER}/android`)
  shell.mkdir('-p', `${OUT_FOLDER}/ios`)

  // Build the list of plugins to be included in container
  const manifest = require(`${platformPath}/manifest.json`)
  const includedPlugins = buildPluginListSync(plugins, manifest)

  // Let's make sure that react-native is included (otherwise there is
  // something pretty much wrong)
  const reactNativePlugin = _.find(includedPlugins, p => p.name === 'react-native')
  if (!reactNativePlugin) {
    throw new Error("react-native was not found in plugins list !")
  }

  // Get the react native version to use, based on what is declared on manifest
  // for this current platform version
  const reactNativeVersion = getReactNativeVersionFromManifest(manifest)
  const ernPlatformVersion = manifest.platformVersion

  let miniApps = _.map(miniapps, miniapp => ({
    name: miniapp.name,
    scope: miniapp.scope,
    version: miniapp.version,
    unscopedName: getUnscopedModuleName(miniapp.name),
    pascalCaseName: capitalizeFirstLetter(getUnscopedModuleName(miniapp.name))
  }))

  mustacheView = {
    reactNativeVersion,
    ernPlatformVersion,
    nativeAppName,
    miniApps
  }

  generator.generateContainer(
    containerVersion,
    nativeAppName,
    platformPath,
    includedPlugins,
    miniApps,
    paths,
    mustacheView)
}

function required(param) {
  throw new Error(`Missing required ${param} parameter`)
}

function getUnscopedModuleName(pluginName) {
  return npmScopeModuleRe.test(pluginName) ?
      npmScopeModuleRe.exec(`${pluginName}`)[2]
      : pluginName
}

function buildPluginListSync(plugins, manifest) {
  let result = []

  const manifestPlugins = _.map(
    manifest.supportedPlugins, d => ({
        name: npmModuleRe.exec(d)[1],
        version: npmModuleRe.exec(d)[2]
    }))

  const pluginNames = _.map(plugins,
    p => p.scope
    ? `@${p.scope}/${p.name}`
    : p.name
  )

  for (const manifestPlugin of manifestPlugins) {
    if (pluginNames.includes(manifestPlugin.name)) {
      result.push(manifestPlugin)
    }
  }

  return result
}

function getReactNativeVersionFromManifest(manifest) {
  const rnDep = _.find(manifest.supportedPlugins, d => d.startsWith('react-native@'))
  return npmModuleRe.exec(rnDep)[2]
}
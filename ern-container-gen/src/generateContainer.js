// @flow

import {
  Dependency
} from 'ern-util'
import {
  capitalizeFirstLetter,
  throwIfShellCommandFailed
} from './utils.js'
import _ from 'lodash'
import shell from 'shelljs'

let mustacheView = {}

const npmScopeModuleRe = /(@.*)\/(.*)/

// =============================================================================
// ern-container-gen entry point
// =============================================================================

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
export default async function generateContainer ({
  containerVersion,
  nativeAppName,
  platformPath,
  generator,
  plugins,
  miniapps,
  workingFolder,
  pathToYarnLock
} : {
  containerVersion: string,
  nativeAppName: string,
  platformPath: string,
  generator: any,
  plugins: Array<Dependency>,
  miniapps: Array<any>,
  workingFolder: string,
  pathToYarnLock?: string
} = {}) {
  if (!generator.generateContainer) {
    throw new Error('The generator miss a generateContainer function !')
  }

  // Folder from which we download all plugins sources (from npm or git)
  const PLUGINS_DOWNLOAD_FOLDER = `${workingFolder}/plugins`
  // Folder where the resulting container project is stored in
  const OUT_FOLDER = `${workingFolder}/out`
  // Folder from which we assemble the miniapps together / run the bundling
  const COMPOSITE_MINIAPP_FOLDER = `${workingFolder}/compositeMiniApp`

  // Contains all interesting folders paths
  const paths = {
    // Where the container project hull is stored
    containerHull: `${platformPath}/ern-container-gen/hull`,
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
  throwIfShellCommandFailed()

  // Sort the plugin to have consistent ElectrodeContainer.java generated code
  sortPlugins(plugins)

  // Let's make sure that react-native is included (otherwise there is
  // something pretty much wrong)
  const reactNativePlugin = _.find(plugins, p => p.name === 'react-native')
  if (!reactNativePlugin) {
    throw new Error('react-native was not found in plugins list !')
  }

  let miniApps = _.map(miniapps, miniapp => ({
    name: miniapp.name,
    scope: miniapp.scope,
    version: miniapp.version,
    unscopedName: getUnscopedModuleName(miniapp.name).replace(/-/g, ''),
    pascalCaseName: capitalizeFirstLetter(getUnscopedModuleName(miniapp.name)).replace(/-/g, ''),
    localPath: miniapp.localPath,
    packagePath: miniapp.packagePath
  }))

  mustacheView = {
    reactNativeVersion: reactNativePlugin.version,
    nativeAppName,
    miniApps,
    containerVersion
  }
  await generator.generateContainer(
    containerVersion,
    nativeAppName,
    plugins,
    miniApps,
    paths,
    mustacheView,
    {pathToYarnLock})

  return paths
}

function getUnscopedModuleName (moduleName) {
  return npmScopeModuleRe.test(moduleName)
      ? npmScopeModuleRe.exec(`${moduleName}`)[2]
      : moduleName
}

function sortPlugins (plugins: Array<Dependency>) {
  return plugins.sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }
    return 0
  })
}

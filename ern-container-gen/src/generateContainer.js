// @flow

import {
  Dependency,
  shell
} from 'ern-util'
import {
  MiniApp
} from 'ern-core'
import {
  capitalizeFirstLetter
} from './utils.js'
import _ from 'lodash'
import semver from 'semver'
import path from 'path'
import type {
  ContainerGenerator,
  ContainerGeneratorPaths
} from './FlowTypes'

let mustacheView = {}

export default async function generateContainer ({
  containerVersion,
  nativeAppName,
  platformPath,
  generator,
  plugins,
  miniapps,
  workingDirectory,
  pathToYarnLock
} : {
  containerVersion: string,
  nativeAppName: string,
  platformPath: string,
  generator: ContainerGenerator,
  plugins: Array<Dependency>,
  miniapps: Array<MiniApp>,
  workingDirectory: string,
  pathToYarnLock?: string
} = {}) {
  // Directory from which we download all plugins sources (from npm or git)
  const PLUGINS_DOWNLOAD_DIRECTORY = path.join(workingDirectory, 'plugins')
  // Directory where the resulting container project is stored in
  const OUT_DIRECTORY = path.join(workingDirectory, 'out')
  // Directory from which we assemble the miniapps together / run the bundling
  const COMPOSITE_MINIAPP_DIRECTORY = path.join(workingDirectory, 'compositeMiniApp')

  // Contains all interesting directorys paths
  const paths : ContainerGeneratorPaths = {
    // Where the container project hull is stored
    containerHull: path.join(platformPath, 'ern-container-gen', 'hull'),
    // Where the templates to be used during container generation are stored
    containerTemplates: path.join(platformPath, 'ern-container-gen', 'templates'),
    // Where we assemble the miniapps together
    compositeMiniApp: COMPOSITE_MINIAPP_DIRECTORY,
    // Where we download plugins
    pluginsDownloadDirectory: PLUGINS_DOWNLOAD_DIRECTORY,
    // Where we output final generated container
    outDirectory: OUT_DIRECTORY
  }

  // Clean up to start fresh
  shell.rm('-rf', PLUGINS_DOWNLOAD_DIRECTORY)
  shell.rm('-rf', OUT_DIRECTORY)
  shell.rm('-rf', COMPOSITE_MINIAPP_DIRECTORY)
  shell.mkdir('-p', PLUGINS_DOWNLOAD_DIRECTORY)
  shell.mkdir('-p', path.join(OUT_DIRECTORY, 'android'))
  shell.mkdir('-p', path.join(OUT_DIRECTORY, 'ios'))

  // Sort the plugin to have consistent ElectrodeContainer.java generated code
  sortPlugins(plugins)

  // Let's make sure that react-native is included (otherwise there is
  // something pretty much wrong)
  const reactNativePlugin = _.find(plugins, p => p.name === 'react-native')
  if (!reactNativePlugin) {
    throw new Error('react-native was not found in plugins list !')
  }

  mustacheView = {
    nativeAppName,
    containerVersion,
    miniApps: _.map(miniapps, miniapp => ({
      name: miniapp.name,
      scope: miniapp.scope,
      version: miniapp.version,
      unscopedName: miniapp.name.replace(/-/g, ''),
      pascalCaseName: capitalizeFirstLetter(miniapp.name.replace(/-/g, '')),
      localPath: miniapp.path,
      packagePath: miniapp.packageDescriptor
    }))
  }

  mustacheView = addReactNativeVersionKeysToMustacheView(
    mustacheView,
    reactNativePlugin.version)

  await generator.generateContainer(
    containerVersion,
    nativeAppName,
    plugins,
    miniapps,
    paths,
    mustacheView,
    {pathToYarnLock})

  return paths
}

function addReactNativeVersionKeysToMustacheView (
  mustacheView: Object,
  reactNativeVersion: string) {
  return Object.assign(mustacheView, {
    reactNativeVersion,
    RN_VERSION_GTE_49: semver.gte(reactNativeVersion, '0.49.0'),
    RN_VERSION_LT_49: semver.lt(reactNativeVersion, '0.49.0')
  })
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

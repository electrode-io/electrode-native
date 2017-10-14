// @flow

import {
  Dependency,
  shell
} from 'ern-util'
import {
  MiniApp,
  Platform
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
  generator,
  plugins,
  miniapps,
  workingDirectory,
  pathToYarnLock
} : {
  containerVersion: string,
  nativeAppName: string,
  generator: ContainerGenerator,
  plugins: Array<Dependency>,
  miniapps: Array<MiniApp>,
  workingDirectory: string,
  pathToYarnLock?: string
} = {}) {
  const PLUGINS_DOWNLOAD_DIRECTORY = path.join(workingDirectory, 'plugins')
  const OUT_DIRECTORY = path.join(workingDirectory, 'out')
  const COMPOSITE_MINIAPP_DIRECTORY = path.join(workingDirectory, 'compositeMiniApp')

  const paths : ContainerGeneratorPaths = {
    containerHull: path.join(Platform.currentPlatformVersionPath, 'ern-container-gen', 'hull'),
    containerTemplates: path.join(Platform.currentPlatformVersionPath, 'ern-container-gen', 'templates'),
    compositeMiniApp: COMPOSITE_MINIAPP_DIRECTORY,
    pluginsDownloadDirectory: PLUGINS_DOWNLOAD_DIRECTORY,
    outDirectory: OUT_DIRECTORY
  }

  shell.rm('-rf', PLUGINS_DOWNLOAD_DIRECTORY)
  shell.rm('-rf', OUT_DIRECTORY)
  shell.rm('-rf', COMPOSITE_MINIAPP_DIRECTORY)
  shell.mkdir('-p', PLUGINS_DOWNLOAD_DIRECTORY)
  shell.mkdir('-p', path.join(OUT_DIRECTORY, generator.platform))
  shell.mkdir('-p', path.join(OUT_DIRECTORY, 'ios'))

  sortPlugins(plugins)

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

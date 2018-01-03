// @flow

import {
  Dependency,
  shell,
  MiniApp
} from 'ern-core'
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
  const OUT_DIRECTORY = path.join(workingDirectory, 'out', generator.platform)
  const COMPOSITE_MINIAPP_DIRECTORY = path.join(workingDirectory, 'compositeMiniApp')

  const paths : ContainerGeneratorPaths = {
    compositeMiniApp: COMPOSITE_MINIAPP_DIRECTORY,
    pluginsDownloadDirectory: PLUGINS_DOWNLOAD_DIRECTORY,
    outDirectory: OUT_DIRECTORY
  }

  shell.rm('-rf', PLUGINS_DOWNLOAD_DIRECTORY)
  shell.rm('-rf', OUT_DIRECTORY)
  shell.rm('-rf', COMPOSITE_MINIAPP_DIRECTORY)
  shell.mkdir('-p', PLUGINS_DOWNLOAD_DIRECTORY)
  shell.mkdir('-p', OUT_DIRECTORY)
  shell.mkdir('-p', COMPOSITE_MINIAPP_DIRECTORY)

  sortPlugins(plugins)

  const reactNativePlugin = _.find(plugins, p => p.name === 'react-native')
  if (!reactNativePlugin) {
    throw new Error('react-native was not found in plugins list !')
  }

  mustacheView = {
    nativeAppName,
    containerVersion,
    miniapps
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

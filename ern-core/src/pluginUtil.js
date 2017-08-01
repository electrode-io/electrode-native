// @flow

import {
  Dependency
} from 'ern-util'
import fs from 'fs'
import path from 'path'
import Mustache from 'mustache'
import shell from 'shelljs'
import _ from 'lodash'
import Platform from './Platform'

export type PluginConfig = {
  android: Object,
  ios: Object,
  origin?: Object,
  path?: string
}

const npmScopeModuleRe = /@(.*)\/(.*)/
const pluginConfigFileName = 'config.json'
const ERN_VERSION_DIRECTORY_RE = /ern_v(.+)\+/

function getPluginsConfigurationDirectories (maxVersion: string = Platform.currentVersion) : Array<string> {
  return _(fs.readdirSync(`${Platform.manifestDirectory}/plugins`))
          .filter(d => ERN_VERSION_DIRECTORY_RE.test(d) && ERN_VERSION_DIRECTORY_RE.exec(d)[1] <= maxVersion)
          .map(d => `${Platform.manifestDirectory}/plugins/${d}`)
          .value()
}

export function getPluginConfigurationPath (
  plugin: Dependency,
  platformVersion: string = Platform.currentVersion) : ?string {
  const orderedPluginsConfigurationDirectories = _(getPluginsConfigurationDirectories(platformVersion))
                                                .sortBy()
                                                .reverse()
                                                .value()

  for (const pluginsConfigurationDirectory of orderedPluginsConfigurationDirectories) {
    // Directory names cannot contain '/', so, replaced by ':'
    const pluginScopeAndName = plugin.scopedName.replace(/\//g, ':')

    const pluginVersions = _.map(
      fs.readdirSync(pluginsConfigurationDirectory).filter(f => f.startsWith(pluginScopeAndName)),
      s => /_v(.+)\+/.exec(s)[1])

    const matchingVersion = _.find(pluginVersions.sort().reverse(), d => plugin.version >= d)
    if (matchingVersion) {
      const pluginConfigurationPath = `${pluginsConfigurationDirectory}/${pluginScopeAndName}_v${matchingVersion}+`
      if (fs.existsSync(`${pluginConfigurationPath}/${pluginConfigFileName}`)) {
        return pluginConfigurationPath
      }
    }
  }
}

//
// Get the container injection configuration of a given plugin
// plugin: A plugin object
// projectName : The name of the project where this plugin will be injected into.
//               Used for iOS plugin config only for now.
// Sample plugin object :
// {
//   name: "react-native-code-push",
//   version: "1.2.3"
// }
export async function getPluginConfig (
  plugin: Dependency,
  projectName: string = 'ElectrodeContainer',
  platformVersion: string = Platform.currentVersion) : Promise<PluginConfig> {
  let result = {}
  const pluginConfigPath = getPluginConfigurationPath(plugin, platformVersion)

  // If there is a base file (common to all versions) use it and optionally
  // patch it with specific version config (if present)
  if (pluginConfigPath && fs.existsSync(`${pluginConfigPath}/${pluginConfigFileName}`)) {
    let configFile = await readFile(`${pluginConfigPath}/${pluginConfigFileName}`, 'utf-8')
    configFile = Mustache.render(configFile, { projectName })
    result = JSON.parse(configFile)

    // Add default value (convention) for Android subsection for missing fields
    if (result.android) {
      if (result.android.root === undefined) {
        result.android.root = 'android'
      }

      if (!result.android.pluginHook) {
        result.android.pluginHook = {}
        const matchedFiles =
          shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.java$/) })
        throwIfShellCommandFailed()
        if (matchedFiles && matchedFiles.length === 1) {
          const pluginHookClass = path.basename(matchedFiles[0], '.java')
          result.android.pluginHook.name = pluginHookClass
          if (fs.readFileSync(matchedFiles[0], 'utf-8').includes('public static class Config')) {
            result.android.pluginHook.configurable = true
          }
        }
      }
    }
    if (result.ios) {
      if (result.ios.root === undefined) {
        result.ios.root = 'ios'
      }

      if (!result.ios.pluginHook) {
        const matchedHeaderFiles =
          shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.h$/) })
        throwIfShellCommandFailed()
        const matchedSourceFiles =
          shell.find(pluginConfigPath).filter(function (file) { return file.match(/\.m$/) })
        if (matchedHeaderFiles && matchedHeaderFiles.length === 1 && matchedSourceFiles && matchedSourceFiles.length === 1) {
          result.ios.pluginHook = {}
          const pluginHookClass = path.basename(matchedHeaderFiles[0], '.h')
          result.ios.pluginHook.name = pluginHookClass
          result.ios.pluginHook.configurable = true // TODO: CLAIRE change if it should be true on different types of plugins
          result.ios.pluginHook.header = matchedHeaderFiles[0]
          result.ios.pluginHook.source = matchedSourceFiles[0]
        }
      }
    }
    result.path = pluginConfigPath
  } else {
    log.debug(`No config.json file for ${plugin.name}. Will use default config`)
    result = getApiPluginDefaultConfig(projectName)
  }

  if (!result.origin) {
    if (npmScopeModuleRe.test(plugin.scopedName)) {
      result.origin = {
        type: 'npm',
        scope: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[1]}`,
        name: `${npmScopeModuleRe.exec(`${plugin.scopedName}`)[2]}`,
        version: plugin.version
      }
    } else {
      result.origin = {
        type: 'npm',
        name: plugin.name,
        version: plugin.version
      }
    }
  } else if (!result.origin.version) {
    result.origin.version = plugin.version
  }

  return result
}

function getApiPluginDefaultConfig (projectName?: string = 'UNKNOWN') : PluginConfig {
  return {
    android: {
      root: 'android',
      moduleName: 'lib',
      transform: [
        { file: 'android/lib/build.gradle' }
      ]
    },
    ios: {
      copy: [
        {
          source: 'IOS/IOS/Classes/SwaggersAPIs/*',
          dest: `${projectName}/APIs`
        }
      ],
      pbxproj: {
        addSource: [
          {
            from: 'IOS/IOS/Classes/SwaggersAPIs/*.swift',
            path: 'APIs',
            group: 'APIs'
          }
        ]
      }
    }
  }
}

// =============================================================================
// Async wrappers
// =============================================================================

async function readFile (
  filename: string,
  enc: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, enc, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  })
}

// =============================================================================
// Shell error helper
// =============================================================================

export function throwIfShellCommandFailed () {
  const shellError = shell.error()
  if (shellError) {
    throw new Error(shellError)
  }
}

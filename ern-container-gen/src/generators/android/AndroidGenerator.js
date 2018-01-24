// @flow

import {
  manifest,
  handleCopyDirective,
  utils as coreUtils,
  mustacheUtils,
  PackagePath,
  shell
} from 'ern-core'
import {
  bundleMiniApps,
  generatePluginsMustacheViews,
  copyRnpmAssets,
  injectReactNativeVersionKeysInObject,
  sortDependenciesByName,
  populateApiImplMustacheView
} from '../../utils.js'
import _ from 'lodash'
import path from 'path'
import readDir from 'fs-readdir-recursive'
import fs from 'fs'
import type {
  ContainerGenerator,
  ContainerGeneratorConfig
} from '../../FlowTypes'

const ROOT_DIR = process.cwd()
const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates')
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class AndroidGenerator implements ContainerGenerator {
  get name () : string {
    return 'AndroidGenerator'
  }

  get platform (): string {
    return 'android'
  }

  prepareDirectories (config: ContainerGeneratorConfig) {
    if (!fs.existsSync(config.outDir)) {
      shell.mkdir('-p', config.outDir)
    } else {
      shell.rm('-rf', path.join(config.outDir, '{.*,*}'))
    }

    if (!fs.existsSync(config.compositeMiniAppDir)) {
      shell.mkdir('-p', config.compositeMiniAppDir)
    } else {
      shell.rm('-rf', path.join(config.compositeMiniAppDir, '{.*,*}'))
    }

    if (!fs.existsSync(config.pluginsDownloadDir)) {
      shell.mkdir('-p', config.pluginsDownloadDir)
    } else {
      shell.rm('-rf', path.join(config.pluginsDownloadDir, '{.*,*}'))
    }
  }

  async generate (config: ContainerGeneratorConfig) : Promise<void> {
    try {
      this.prepareDirectories(config)
      config.plugins = sortDependenciesByName(config.plugins)

      shell.cd(config.outDir)

      await this.fillContainerHull(config)

      const jsApiImplDependencies = await coreUtils.extractJsApiImplementations(config.plugins)

      await bundleMiniApps(
        config.miniApps,
        config.compositeMiniAppDir,
        config.outDir,
        'android',
        { pathToYarnLock: config.pathToYarnLock },
        jsApiImplDependencies)

      if (!config.ignoreRnpmAssets) {
        copyRnpmAssets(config.miniApps, config.compositeMiniAppDir, config.outDir)
      }
    } catch (e) {
      log.error('[generateContainer] Something went wrong. Aborting Container Generation')
      throw e
    }
  }

  async fillContainerHull (config: ContainerGeneratorConfig) : Promise<void> {
    try {
      log.debug('[=== Starting container hull filling ===]')

      shell.cd(ROOT_DIR)

      const copyFromPath = path.join(PATH_TO_HULL_DIR, '{.*,*}')

      shell.cp('-R', copyFromPath, config.outDir)

      // https://github.com/npm/npm/issues/1862 : Npm renames .gitigonre to .npmignore causing the generated contaier to emit the .gitnore file. This solution below helps to bypass it.
      shell.mv(`${config.outDir}/gitignore`, `${config.outDir}/.gitignore`)

      const reactNativePlugin = _.find(config.plugins, p => p.basePath === 'react-native')
      if (!reactNativePlugin) {
        throw new Error('react-native was not found in plugins list !')
      }

      const mustacheView = {}
      injectReactNativeVersionKeysInObject(mustacheView, reactNativePlugin.version)
      mustacheView.miniApps = config.miniApps

      await this.buildAndroidPluginsViews(config.plugins, mustacheView)
      await this.addAndroidPluginHookClasses(config.plugins, config.outDir)

      for (const plugin of config.plugins) {
        if (await coreUtils.isDependencyJsApiImpl(plugin.basePath)) {
          log.debug('JS api implementation identified, skipping fill hull.')
          continue
        }

        let pluginConfig = await manifest.getPluginConfig(plugin)
        let pluginSourcePath
        if (plugin.basePath === 'react-native') { continue }
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.basePath} as it does not have an Android configuration`)
          continue
        }

        shell.cd(config.pluginsDownloadDir)
        pluginSourcePath = await coreUtils.downloadPluginSource(pluginConfig.origin)
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.basePath}`)
        }

        if (await coreUtils.isDependencyNativeApiImpl(plugin.basePath)) {
          populateApiImplMustacheView(pluginSourcePath, mustacheView, true)
        }

        const pathToPluginProject = path.join(pluginSourcePath, pluginConfig.android.root)
        shell.cd(pathToPluginProject)

        const relPathToPluginSource = pluginConfig.android.moduleName
          ? path.join(pluginConfig.android.moduleName, 'src', 'main', 'java')
          : path.join('src', 'main', 'java')
        const absPathToCopyPluginSourceTo = path.join(config.outDir, 'lib', 'src', 'main')
        shell.cp('-R', relPathToPluginSource, absPathToCopyPluginSourceTo)

        if (pluginConfig.android) {
          if (pluginConfig.android.copy) {
            handleCopyDirective(pluginSourcePath, config.outDir, pluginConfig.android.copy)
          }

          if (pluginConfig.android.dependencies) {
            for (const dependency of pluginConfig.android.dependencies) {
              log.debug(`Adding compile '${dependency}'`)
              mustacheView.pluginCompile.push({
                'compileStatement': `compile '${dependency}'`
              })
            }
          }
        }
      }

      log.debug('Patching hull')
      const files = readDir(config.outDir, (f) => (!f.endsWith('.jar') && !f.endsWith('.aar') && !f.endsWith('.git')))
      const pathLibSrcMain = path.join('lib', 'src', 'main')
      const pathLibSrcMainAssets = path.join('lib', 'src', 'main', 'assets')
      const pathLibSrcMainJavaCom = path.join(pathLibSrcMain, 'java', 'com')
      const pathLibSrcMainJavaComWalmartlabsErnContainer = path.join(pathLibSrcMainJavaCom, 'walmartlabs', 'ern', 'container')
      for (const file of files) {
        if ((file.startsWith(pathLibSrcMainJavaCom) && !file.startsWith(pathLibSrcMainJavaComWalmartlabsErnContainer)) ||
          file.startsWith(pathLibSrcMainAssets)) {
          // We don't want to Mustache process library files. It can lead to bad things
          // We also don't want to process assets files ...
          // We just want to process container specific code (which contains mustache templates)
          log.debug(`Skipping mustaching of ${file}`)
          continue
        }
        log.debug(`Mustaching ${file}`)
        const pathToFile = path.join(config.outDir, file)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(pathToFile, mustacheView, pathToFile)
      }

      log.debug('Creating miniapp activities')
      for (const miniApp of config.miniApps) {
        let activityFileName = `${miniApp.pascalCaseName}Activity.java`

        log.debug(`Creating ${activityFileName}`)
        const pathToMiniAppActivityMustacheTemplate = path.join(PATH_TO_TEMPLATES_DIR, 'MiniAppActivity.mustache')
        const pathToOutputActivityFile = path.join(config.outDir, pathLibSrcMainJavaComWalmartlabsErnContainer, 'miniapps', activityFileName)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
            pathToMiniAppActivityMustacheTemplate,
            miniApp,
            pathToOutputActivityFile)
      }

      log.debug('[=== Completed container hull filling ===]')
    } catch (e) {
      log.error('[fillContainerHull] Something went wrong: ' + e)
      throw e
    }
  }

  async addAndroidPluginHookClasses (
    plugins: Array<PackagePath>,
    outDir: string) : Promise<*> {
    try {
      log.debug('[=== Adding plugin hook classes ===]')

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.android) {
          log.warn(`Skipping ${plugin.basePath} as it does not have an Android configuration`)
          continue
        }
        let androidPluginHook = pluginConfig.android.pluginHook
        if (androidPluginHook) {
          log.debug(`Adding ${androidPluginHook.name}.java`)
          if (!pluginConfig.path) {
            throw new Error('No plugin config path was set. Cannot proceed.')
          }
          const pathToPluginConfigHook = path.join(pluginConfig.path, `${androidPluginHook.name}.java`)
          const pathToCopyPluginConfigHookTo =
            path.join(outDir, 'lib', 'src', 'main', 'java', 'com', 'walmartlabs', 'ern', 'container', 'plugins')
          shell.cp(pathToPluginConfigHook, pathToCopyPluginConfigHookTo)
        }
      }

      log.debug('[=== Done adding plugin hook classes ===]')
    } catch (e) {
      log.error('[addAndroidPluginHookClasses] Something went wrong: ' + e)
      throw e
    }
  }

  async buildAndroidPluginsViews (
    plugins: Array<PackagePath>,
    mustacheView: any) : Promise<*> {
    try {
      mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'android')
      mustacheView.pluginCompile = []
      const reactNativePlugin = _.find(plugins, p => p.basePath === 'react-native')
      if (reactNativePlugin) {
        log.debug(`Will inject: compile 'com.walmartlabs.ern:react-native:${reactNativePlugin.version}'`)
        mustacheView.pluginCompile.push({
          'compileStatement': `compile 'com.walmartlabs.ern:react-native:${reactNativePlugin.version}'`
        })
      }
    } catch (e) {
      log.error('[buildAndroidPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }
}

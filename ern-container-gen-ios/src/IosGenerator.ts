import {
  manifest,
  iosUtil,
  injectReactNativeVersionKeysInObject,
  utils,
  PackagePath,
  shell,
  log,
  NativePlatform,
  kax,
} from 'ern-core'
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
  generatePluginsMustacheViews,
  populateApiImplMustacheView,
  generateContainer,
} from 'ern-container-gen'

import fs from 'fs-extra'
import path from 'path'
import xcode from 'xcode-ern'
import _ from 'lodash'
import readDir from 'fs-readdir-recursive'
import { Composite } from 'ern-composite-gen'

const ROOT_DIR = process.cwd()
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export default class IosGenerator implements ContainerGenerator {
  get name(): string {
    return 'IosGenerator'
  }

  get platform(): NativePlatform {
    return 'ios'
  }

  public async generate(
    config: ContainerGeneratorConfig
  ): Promise<ContainerGenResult> {
    return generateContainer(config, {
      fillContainerHull: this.fillContainerHull.bind(this),
      postCopyRnpmAssets: this.addResources.bind(this),
    })
  }

  public async addResources(config: ContainerGeneratorConfig) {
    const containerProjectPath = path.join(
      config.outDir,
      'ElectrodeContainer.xcodeproj',
      'project.pbxproj'
    )
    const containerIosProject = await this.getIosContainerProject(
      containerProjectPath
    )

    const containerResourcesPath = path.join(
      config.outDir,
      'ElectrodeContainer',
      'Resources'
    )
    const resourceFiles = readDir(containerResourcesPath)
    resourceFiles.forEach(resourceFile => {
      containerIosProject.addResourceFile(
        path.join('Resources', resourceFile),
        null,
        containerIosProject.findPBXGroupKey({ name: 'Resources' })
      )
    })

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())
  }

  public async fillContainerHull(
    config: ContainerGeneratorConfig
  ): Promise<void> {
    const pathSpec = {
      outputDir: config.outDir,
      projectHullDir: path.join(PATH_TO_HULL_DIR, '{.*,*}'),
      rootDir: ROOT_DIR,
    }

    const projectSpec = {
      projectName: 'ElectrodeContainer',
    }

    const reactNativePlugin = _.find(
      config.plugins,
      p => p.name === 'react-native'
    )
    if (!reactNativePlugin) {
      throw new Error('react-native was not found in plugins list !')
    }
    if (!reactNativePlugin.version) {
      throw new Error('react-native plugin does not have a version !')
    }

    const mustacheView: any = {}
    mustacheView.jsMainModuleName = config.jsMainModuleName || 'index'
    injectReactNativeVersionKeysInObject(
      mustacheView,
      reactNativePlugin.version
    )

    await kax
      .task('Preparing Native Dependencies Injection')
      .run(this.buildiOSPluginsViews(config.plugins, mustacheView))

    await kax
      .task('Preparing API Implementations Injection')
      .run(
        this.buildApiImplPluginViews(
          config.plugins,
          config.composite,
          mustacheView,
          projectSpec
        )
      )
    const { iosProject, projectPath } = await iosUtil.fillProjectHull(
      pathSpec,
      projectSpec,
      config.plugins,
      mustacheView,
      config.composite
    )

    await kax
      .task('Adding Native Dependencies Hooks')
      .run(
        this.addiOSPluginHookClasses(iosProject, config.plugins, config.outDir)
      )

    fs.writeFileSync(projectPath, iosProject.writeSync())
  }

  // Code to keep backward compatibility
  public switchToOldDirectoryStructure(
    pluginSourcePath: string,
    tail: string
  ): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join(
      'IOS',
      'IOS',
      'Classes',
      'SwaggersAPIs'
    )
    if (
      path.dirname(tail) === 'IOS' &&
      fs.pathExistsSync(
        path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs))
      )
    ) {
      return true
    }
    return false
  }

  public async buildiOSPluginsViews(
    plugins: PackagePath[],
    mustacheView: any
  ): Promise<any> {
    mustacheView.plugins = await generatePluginsMustacheViews(plugins, 'ios')
  }

  public async addiOSPluginHookClasses(
    containerIosProject: any,
    plugins: PackagePath[],
    outDir: string
  ): Promise<any> {
    for (const plugin of plugins) {
      if (plugin.name === 'react-native') {
        continue
      }
      const pluginConfig = await manifest.getPluginConfig(plugin)
      if (!pluginConfig) {
        continue
      }
      if (!pluginConfig.ios) {
        log.warn(
          `${plugin.name} does not have any injection configuration for ios platform`
        )
        continue
      }
      const iOSPluginHook = pluginConfig.ios.pluginHook
      if (iOSPluginHook?.name) {
        if (!pluginConfig.path) {
          throw new Error('No plugin config path was set. Cannot proceed.')
        }

        const pluginConfigPath = pluginConfig.path
        const pathToCopyPluginHooksTo = path.join(outDir, 'ElectrodeContainer')

        log.debug(`Adding ${iOSPluginHook.name}.h`)
        const pathToPluginHookHeader = path.join(
          pluginConfigPath,
          `${iOSPluginHook.name}.h`
        )
        shell.cp(pathToPluginHookHeader, pathToCopyPluginHooksTo)
        containerIosProject.addHeaderFile(
          `${iOSPluginHook.name}.h`,
          { public: true },
          containerIosProject.findPBXGroupKey({ name: 'ElectrodeContainer' })
        )

        log.debug(`Adding ${iOSPluginHook.name}.m`)
        const pathToPluginHookSource = path.join(
          pluginConfigPath,
          `${iOSPluginHook.name}.m`
        )
        shell.cp(pathToPluginHookSource, pathToCopyPluginHooksTo)
        containerIosProject.addSourceFile(
          `${iOSPluginHook.name}.m`,
          null,
          containerIosProject.findPBXGroupKey({ name: 'ElectrodeContainer' })
        )
      }
    }
  }

  public async getIosContainerProject(
    containerProjectPath: string
  ): Promise<any> {
    const containerProject = xcode.project(containerProjectPath)
    return new Promise((resolve, reject) => {
      containerProject.parse((err: any) => {
        if (err) {
          reject(err)
        }
        resolve(containerProject)
      })
    })
  }

  public async buildApiImplPluginViews(
    plugins: PackagePath[],
    composite: Composite,
    mustacheView: any,
    projectSpec: any
  ) {
    for (const plugin of plugins) {
      const pluginConfig = await manifest.getPluginConfig(
        plugin,
        projectSpec.projectName
      )
      if (!pluginConfig) {
        continue
      }

      if (await utils.isDependencyPathNativeApiImpl(plugin.basePath)) {
        populateApiImplMustacheView(plugin.basePath, mustacheView, true)
      }
    }

    if (mustacheView.apiImplementations) {
      mustacheView.hasApiImpl = true
      for (const api of mustacheView.apiImplementations) {
        if (api.hasConfig) {
          mustacheView.hasAtleastOneApiImplConfig = true
          break
        }
      }
    }
  }
}

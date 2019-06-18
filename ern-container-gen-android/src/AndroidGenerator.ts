import {
  manifest,
  handleCopyDirective,
  utils as coreUtils,
  mustacheUtils,
  PackagePath,
  shell,
  log,
  NativePlatform,
  kax,
  android,
  AndroidResolvedVersions,
  readPackageJson,
} from 'ern-core'
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
  generatePluginsMustacheViews,
  injectReactNativeVersionKeysInObject,
  populateApiImplMustacheView,
  generateContainer,
} from 'ern-container-gen'

import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import readDir from 'fs-readdir-recursive'

const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates')
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

export interface AndroidDependencies {
  files: string[]
  transitive: string[]
  regular: string[]
  annotationProcessor: string[]
}

export default class AndroidGenerator implements ContainerGenerator {
  get name(): string {
    return 'AndroidGenerator'
  }

  get platform(): NativePlatform {
    return 'android'
  }

  public async generate(
    config: ContainerGeneratorConfig
  ): Promise<ContainerGenResult> {
    return generateContainer(config, {
      fillContainerHull: this.fillContainerHull.bind(this),
    })
  }

  public async fillContainerHull(
    config: ContainerGeneratorConfig
  ): Promise<void> {
    const copyFromPath = path.join(PATH_TO_HULL_DIR, '{.*,*}')

    shell.cp('-R', copyFromPath, config.outDir)

    // https://github.com/npm/npm/issues/1862 : Npm renames .gitigonre to .npmignore causing the generated contaier to emit the .gitnore file. This solution below helps to bypass it.
    shell.mv(`${config.outDir}/gitignore`, `${config.outDir}/.gitignore`)

    const reactNativePlugin = _.find(
      config.plugins,
      p => p.basePath === 'react-native'
    )

    if (!reactNativePlugin) {
      throw new Error('react-native was not found in plugins list !')
    }
    if (!reactNativePlugin.version) {
      throw new Error('react-native plugin does not have a version !')
    }

    let mustacheView: any = {}
    injectReactNativeVersionKeysInObject(
      mustacheView,
      reactNativePlugin.version
    )

    const electrodeBridgePlugin = _.find(
      config.plugins,
      p => p.basePath === 'react-native-electrode-bridge'
    )

    if (electrodeBridgePlugin) {
      mustacheView.hasElectrodeBridgePlugin = true
    }

    mustacheView.miniApps = config.composite.getMiniApps()
    mustacheView.jsMainModuleName = config.jsMainModuleName || 'index'

    await kax
      .task('Preparing Native Dependencies Injection')
      .run(this.buildAndroidPluginsViews(config.plugins, mustacheView))

    await kax
      .task('Adding Native Dependencies Hooks')
      .run(this.addAndroidPluginHookClasses(config.plugins, config.outDir))

    kax.info('Setting Android tools and libraries versions')
    const versions = android.resolveAndroidVersions(config.androidConfig)
    mustacheView = Object.assign(mustacheView, versions)

    const injectPluginsTaskMsg = 'Injecting Native Dependencies'
    const injectPluginsKaxTask = kax.task(injectPluginsTaskMsg)

    const replacements: Array<() => void> = []
    const dependencies: AndroidDependencies = {
      annotationProcessor: [],
      files: [],
      regular: [],
      transitive: [],
    }

    for (const plugin of config.plugins) {
      let pluginConfig: any = await manifest.getPluginConfig(plugin)
      if (!pluginConfig) {
        continue
      }
      let pluginSourcePath
      if (plugin.basePath === 'react-native') {
        continue
      }

      if (!pluginConfig.android) {
        log.warn(
          `Skipping ${
            plugin.basePath
          } as it does not have an Android configuration`
        )
        continue
      }

      injectPluginsKaxTask.text = `${injectPluginsTaskMsg} [${plugin.basePath}]`

      shell.pushd(config.pluginsDownloadDir)

      let pathToPluginProject
      try {
        const nativeDependencyPathInComposite = await config.composite.getNativeDependencyPath(
          plugin
        )

        pluginSourcePath =
          nativeDependencyPathInComposite ||
          (await coreUtils.downloadPluginSource(pluginConfig.origin))
        if (!pluginSourcePath) {
          throw new Error(`Was not able to retrieve ${plugin.basePath}`)
        }

        if (await coreUtils.isDependencyPathNativeApiImpl(pluginSourcePath)) {
          // For native api implementations, if a 'ern.pluginConfig' object
          // exists in its package.json, replace pluginConfig with this one.
          const pluginPackageJson = await readPackageJson(pluginSourcePath)
          if (pluginPackageJson.ern.pluginConfig) {
            pluginConfig = pluginPackageJson.ern.pluginConfig
          }
          populateApiImplMustacheView(pluginSourcePath, mustacheView, true)
        }

        pathToPluginProject = path.join(
          pluginSourcePath,
          pluginConfig.android.root
        )
      } finally {
        shell.popd()
      }

      shell.pushd(pathToPluginProject)
      try {
        if (await coreUtils.isDependencyPathNativeApiImpl(pluginSourcePath)) {
          // Special handling for native api implementation as we don't
          // want to copy the API and bridge code (part of native api implementations projects)
          const relPathToApiImplSource = path.join(
            'lib',
            'src',
            'main',
            'java',
            'com',
            'ern'
          )
          const absPathToCopyPluginSourceTo = path.join(
            config.outDir,
            'lib',
            'src',
            'main',
            'java',
            'com'
          )
          shell.cp('-R', relPathToApiImplSource, absPathToCopyPluginSourceTo)
        } else {
          const relPathToPluginSource = pluginConfig.android.moduleName
            ? path.join(pluginConfig.android.moduleName, 'src', 'main', 'java')
            : path.join('src', 'main', 'java')
          const absPathToCopyPluginSourceTo = path.join(
            config.outDir,
            'lib',
            'src',
            'main'
          )
          shell.cp('-R', relPathToPluginSource, absPathToCopyPluginSourceTo)
        }

        if (pluginConfig.android) {
          if (pluginConfig.android.copy) {
            handleCopyDirective(
              pluginSourcePath,
              config.outDir,
              pluginConfig.android.copy
            )
          }

          const { replaceInFile } = pluginConfig.android
          if (replaceInFile && Array.isArray(replaceInFile)) {
            for (const r of replaceInFile) {
              replacements.push(() => {
                log.debug(`Performing string replacement on ${r.path}`)
                const pathToFile = path.join(config.outDir, r.path)
                const fileContent = fs.readFileSync(pathToFile, 'utf8')
                const patchedFileContent = fileContent.replace(
                  RegExp(r.string, 'g'),
                  r.replaceWith
                )
                fs.writeFileSync(pathToFile, patchedFileContent, {
                  encoding: 'utf8',
                })
              })
            }
          }

          if (pluginConfig.android.dependencies) {
            const transitivePrefix = 'transitive:'
            const filesPrefix = 'files'
            const annotationProcessorPrefix = 'annotationProcessor:'
            for (const dependency of pluginConfig.android.dependencies) {
              if (dependency.startsWith(transitivePrefix)) {
                dependencies.transitive.push(
                  dependency.replace(transitivePrefix, '')
                )
              } else if (dependency.startsWith(filesPrefix)) {
                dependencies.files.push(dependency)
              } else if (dependency.startsWith(annotationProcessorPrefix)) {
                dependencies.annotationProcessor.push(
                  dependency.replace(annotationProcessorPrefix, '')
                )
              } else {
                dependencies.regular.push(dependency)
              }
            }
          }
        }
      } finally {
        shell.popd()
      }
    }

    dependencies.regular.push(
      `com.walmartlabs.ern:react-native:${reactNativePlugin.version}`
    )
    dependencies.regular.push(
      `com.android.support:appcompat-v7:${versions.supportLibraryVersion}`
    )
    mustacheView.implementations = this.buildImplementationStatements(
      dependencies,
      versions
    )

    log.debug(
      `Implementation statements to be injected: ${JSON.stringify(
        mustacheView.implementations
      )}`
    )

    injectPluginsKaxTask.succeed(injectPluginsTaskMsg)

    log.debug('Patching hull')
    const files = readDir(
      config.outDir,
      f => !f.endsWith('.jar') && !f.endsWith('.aar') && !f.endsWith('.git')
    )
    const pathLibSrcMain = path.join('lib', 'src', 'main')
    const pathLibSrcMainJniLibs = path.join('lib', 'src', 'main', 'jniLibs')
    const pathLibSrcMainAssets = path.join('lib', 'src', 'main', 'assets')
    const pathLibSrcMainJavaCom = path.join(pathLibSrcMain, 'java', 'com')
    const pathLibSrcMainJavaComWalmartlabsErnContainer = path.join(
      pathLibSrcMainJavaCom,
      'walmartlabs',
      'ern',
      'container'
    )
    for (const file of files) {
      if (
        (file.startsWith(pathLibSrcMainJavaCom) &&
          !file.startsWith(pathLibSrcMainJavaComWalmartlabsErnContainer)) ||
        file.startsWith(pathLibSrcMainAssets) ||
        file.startsWith(pathLibSrcMainJniLibs)
      ) {
        // We don't want to Mustache process library files. It can lead to bad things
        // We also don't want to process assets files ...
        // We just want to process container specific code (which contains mustache templates)
        log.debug(`Skipping mustaching of ${file}`)
        continue
      }
      log.debug(`Mustaching ${file}`)
      const pathToFile = path.join(config.outDir, file)
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToFile,
        mustacheView,
        pathToFile
      )
    }

    log.debug('Creating miniapp activities')
    for (const miniApp of config.composite.getMiniApps()) {
      const activityFileName = `${miniApp.pascalCaseName}Activity.java`

      log.debug(`Creating ${activityFileName}`)
      const pathToMiniAppActivityMustacheTemplate = path.join(
        PATH_TO_TEMPLATES_DIR,
        'MiniAppActivity.mustache'
      )
      const pathToOutputActivityFile = path.join(
        config.outDir,
        pathLibSrcMainJavaComWalmartlabsErnContainer,
        'miniapps',
        activityFileName
      )
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        pathToMiniAppActivityMustacheTemplate,
        miniApp,
        pathToOutputActivityFile
      )
    }

    for (const perform of replacements) {
      perform()
    }
  }

  public buildImplementationStatements(
    dependencies: AndroidDependencies,
    androidVersions: AndroidResolvedVersions
  ) {
    const result: any[] = []

    // Replace versions of support libraries with set version
    dependencies.regular = dependencies.regular.map(d =>
      d.startsWith('com.android.support:')
        ? `${d.slice(0, d.lastIndexOf(':'))}:${
            androidVersions.supportLibraryVersion
          }`
        : d
    )

    // Dedupe dependencies with same version
    dependencies.regular = _.uniq(dependencies.regular)
    dependencies.files = _.uniq(dependencies.files)
    dependencies.transitive = _.uniq(dependencies.transitive)
    dependencies.annotationProcessor = _.uniq(dependencies.annotationProcessor)

    // Use highest versions for regular and transitive
    // dependencies with multiple versions
    const g = _.groupBy(dependencies.regular, x => x.match(/^[^:]+:[^:]+/)![0])
    dependencies.regular = Object.keys(g).map(x => this.highestVersion(g[x]))
    const h = _.groupBy(
      dependencies.transitive,
      x => x.match(/^[^:]+:[^:]+/)![0]
    )
    dependencies.transitive = Object.keys(h).map(x => this.highestVersion(h[x]))

    // Add dependencies to result
    dependencies.regular.forEach(d => result.push(`implementation '${d}'`))
    dependencies.files.forEach(d => result.push(`implementation ${d}`))
    dependencies.transitive.forEach(d =>
      result.push(`implementation ('${d}') { transitive = true }`)
    )
    dependencies.annotationProcessor.forEach(d =>
      result.push(`annotationProcessor '${d}'`)
    )
    return result
  }

  public highestVersion(d: string[]): string {
    if (d.length === 1) {
      return d[0]
    }
    const name = d[0].match(/^[^:]+:[^:]+/)![0]
    const version = d
      .map(x => x.match(/^[^:]+:[^:]+:(.+)/)![1])
      // Trick to make highest version lookup as easy
      // as peforming a lexical sort
      .map(x => x.replace('+', '999999'))
      .sort()
      .map(x => x.replace('999999', '+'))
      .pop()
    return `${name}:${version}`
  }

  public async addAndroidPluginHookClasses(
    plugins: PackagePath[],
    outDir: string
  ): Promise<any> {
    for (const plugin of plugins) {
      if (plugin.basePath === 'react-native') {
        continue
      }
      const pluginConfig = await manifest.getPluginConfig(plugin)
      if (!pluginConfig) {
        continue
      }
      if (!pluginConfig.android) {
        log.warn(
          `Skipping ${
            plugin.basePath
          } as it does not have an Android configuration`
        )
        continue
      }
      const androidPluginHook = pluginConfig.android.pluginHook
      if (androidPluginHook) {
        log.debug(`Adding ${androidPluginHook.name}.java`)
        if (!pluginConfig.path) {
          throw new Error('No plugin config path was set. Cannot proceed.')
        }
        const pathToPluginConfigHook = path.join(
          pluginConfig.path,
          `${androidPluginHook.name}.java`
        )
        const pathToCopyPluginConfigHookTo = path.join(
          outDir,
          'lib',
          'src',
          'main',
          'java',
          'com',
          'walmartlabs',
          'ern',
          'container',
          'plugins'
        )
        shell.cp(pathToPluginConfigHook, pathToCopyPluginConfigHookTo)
      }
    }
  }

  public async buildAndroidPluginsViews(
    plugins: PackagePath[],
    mustacheView: any
  ): Promise<any> {
    mustacheView.plugins = await generatePluginsMustacheViews(
      plugins,
      'android'
    )
    const reactNativeCodePushPlugin = _.find(
      plugins,
      p => p.basePath === 'react-native-code-push'
    )
    if (reactNativeCodePushPlugin) {
      mustacheView.isCodePushPluginIncluded = true
    }
  }
}

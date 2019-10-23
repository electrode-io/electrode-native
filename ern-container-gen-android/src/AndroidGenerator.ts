import {
  manifest,
  handleCopyDirective,
  utils as coreUtils,
  mustacheUtils,
  PackagePath,
  shell,
  injectReactNativeVersionKeysInObject,
  log,
  NativePlatform,
  kax,
  android,
  AndroidResolvedVersions,
  readPackageJson,
  createTmpDir,
  yarn,
} from 'ern-core'
import {
  ContainerGenerator,
  ContainerGeneratorConfig,
  ContainerGenResult,
  generatePluginsMustacheViews,
  populateApiImplMustacheView,
  generateContainer,
} from 'ern-container-gen'

import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import readDir from 'fs-readdir-recursive'
import DecompressZip from 'decompress-zip'
import semver from 'semver'

const PATH_TO_TEMPLATES_DIR = path.join(__dirname, 'templates')
const PATH_TO_HULL_DIR = path.join(__dirname, 'hull')

const DEFAULT_JSC_VARIANT = 'android-jsc'
const DEFAULT_JSC_VERSION = '245459'
const DEFAULT_HERMES_VERSION = '0.2.1'

export interface AndroidDependencies {
  files: string[]
  transitive: string[]
  regular: string[]
  annotationProcessor: string[]
}

export enum JavaScriptEngine {
  HERMES,
  JSC,
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

    let mustacheView: any = {
      customRepos: [],
      permissions: [],
      customPermissions: []
    }
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

      let pathToPluginProject

      const pluginSourcePath = await config.composite.getNativeDependencyPath(
        plugin
      )
      if (!pluginSourcePath) {
        throw new Error(`path to ${plugin.basePath} not found in composite`)
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

          if (pluginConfig.android.repositories) {
            mustacheView.customRepos.push(...pluginConfig.android.repositories)
          }

          if (pluginConfig.android.permissions) {
            mustacheView.customPermissions.push(
              ...pluginConfig.android.permissions
            )
          }
        }
      } finally {
        shell.popd()
      }
    }

    // Dedupe repositories and permissions
    mustacheView.customRepos = _.uniq(mustacheView.customRepos)
    mustacheView.customPermissions = _.uniq(mustacheView.customPermissions)

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

    if (semver.gte(reactNativePlugin.version, '0.60.0')) {
      this.getJavaScriptEngine(config) === JavaScriptEngine.JSC
        ? await kax
            .task('Injecting JavaScript engine [JavaScriptCore]')
            .run(this.injectJavaScriptCoreEngine(config))
        : await kax
            .task('Injecting JavaScript engine [Hermes]')
            .run(this.injectHermesEngine(config))
    }
  }

  public getJavaScriptEngine(
    config: ContainerGeneratorConfig
  ): JavaScriptEngine {
    return config.androidConfig
      ? config.androidConfig.jsEngine === 'jsc'
        ? JavaScriptEngine.JSC
        : config.androidConfig.jsEngine === 'hermes'
        ? JavaScriptEngine.HERMES
        : JavaScriptEngine.JSC
      : JavaScriptEngine.JSC
  }

  /**
   * Starting with React Native 0.60.0, JavaScriptCore engine is distributed
   * separately from React Native and comes in two variants :
   * 'android-jsc' and 'android-jsc-intl'.
   *
   * More details@ https://github.com/react-native-community/jsc-android-buildscript
   *
   * Prior to React Native 0.60.0, the 'libjsc.so' native library files were
   * shipped inside React Native AAR itself. This is not the case anymore.
   * The 'libjsc.so' files are now distributed in the 'jsc-android' npm package,
   * inside an aar library.
   *
   * This function retrieve the 'jsc-android' package and unzip the AAR
   * matching the desired JSC variant ('android-jsc' or 'android-jsc-intl').
   * It then copy the 'libjsc.so' files to the 'jniLibs' directory of the
   * Container. This way, the JSC engine is shipped within the Container and
   * applications won't crash at runtime when trying to load this library.
   */
  public async injectJavaScriptCoreEngine(config: ContainerGeneratorConfig) {
    const jscVersion =
      (config.androidConfig && config.androidConfig.jscVersion) ||
      DEFAULT_JSC_VERSION
    const jscVariant =
      (config.androidConfig && config.androidConfig.jscVariant) ||
      DEFAULT_JSC_VARIANT
    const workingDir = createTmpDir()
    try {
      shell.pushd(workingDir)
      await yarn.init()
      await yarn.add(PackagePath.fromString(`jsc-android@${jscVersion}.0.0`))
      const jscVersionPath = path.resolve(
        `./node_modules/jsc-android/dist/org/webkit/${jscVariant}/r${jscVersion}`
      )
      const jscAARPath = path.join(
        jscVersionPath,
        `${jscVariant}-r${jscVersion}.aar`
      )
      return new Promise((resolve, reject) => {
        const unzipper = new DecompressZip(jscAARPath)
        const unzipOutDir = createTmpDir()
        const containerJniLibsPath = path.join(
          config.outDir,
          'lib/src/main/jniLibs'
        )
        const unzippedJniPath = path.join(unzipOutDir, 'jni')
        unzipper.on('error', err => reject(err))
        unzipper.on('extract', () => {
          shell.cp('-Rf', unzippedJniPath, containerJniLibsPath)
          resolve()
        })
        unzipper.extract({ path: unzipOutDir })
      })
    } finally {
      shell.popd()
    }
  }

  /**
   * Inject hermes engine into the Container
   * Done in a similar way as injectJavaScriptCoreEngine method
   */
  public async injectHermesEngine(config: ContainerGeneratorConfig) {
    const hermesVersion =
      (config.androidConfig && config.androidConfig.hermesVersion) ||
      DEFAULT_HERMES_VERSION
    const workingDir = createTmpDir()
    try {
      shell.pushd(workingDir)
      await yarn.init()
      await yarn.add(PackagePath.fromString(`hermes-engine@${hermesVersion}`))
      const hermesAarPath = path.resolve(
        `./node_modules/hermes-engine/android/hermes-release.aar`
      )
      return new Promise((resolve, reject) => {
        const unzipper = new DecompressZip(hermesAarPath)
        const unzipOutDir = createTmpDir()
        const containerJniLibsPath = path.join(
          config.outDir,
          'lib/src/main/jniLibs'
        )
        const unzippedJniPath = path.join(unzipOutDir, 'jni')
        unzipper.on('error', err => reject(err))
        unzipper.on('extract', () => {
          shell.cp('-Rf', unzippedJniPath, containerJniLibsPath)
          resolve()
        })
        unzipper.extract({ path: unzipOutDir })
      })
    } finally {
      shell.popd()
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

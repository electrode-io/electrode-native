// @flow

import {
  manifest,
  handleCopyDirective,
  GitUtils,
  ContainerGeneratorConfig,
  MiniApp
} from 'ern-core'
import {
  Dependency,
  mustacheUtils,
  shell
} from 'ern-util'

import {
  bundleMiniApps,
  downloadPluginSource
} from '../../utils.js'

import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import xcode from 'xcode-ern'
import readDir from 'fs-readdir-recursive'
import type {
  ContainerGenerator,
  ContainerGeneratorPaths
} from '../../FlowTypes'

const ROOT_DIR = process.cwd()

export default class IosGenerator implements ContainerGenerator {
  _containerGeneratorConfig : ContainerGeneratorConfig

  constructor (containerGeneratorConfig: ContainerGeneratorConfig) {
    this._containerGeneratorConfig = containerGeneratorConfig
  }

  get name () : string {
    return 'IosGenerator'
  }

  get platform () : string {
    return 'ios'
  }

  async generateContainer (
    containerVersion: string,
    nativeAppName: string,
    plugins: Array<Dependency>,
    miniapps: Array<MiniApp>,
    paths: ContainerGeneratorPaths,
    mustacheView: any, {
      pathToYarnLock
    } : {
      pathToYarnLock?: string
    } = {}) : Promise<*> {
    try {
      shell.cd(paths.outDirectory)

      let gitHubPublisher
      if (this._containerGeneratorConfig.shouldPublish()) {
        // TODO: The logic below should be fixed to support multiple publishers. Only GitHub publisher is support for now for iOS
        if ((gitHubPublisher = this._containerGeneratorConfig.firstAvailableGitHubPublisher)) {
          let repoUrl = gitHubPublisher.url
          log.debug(`\n === Using github publisher
          targetRepoUrl: ${repoUrl}
          containerVersion: ${containerVersion}`)

          log.debug(`First lets clone the repo so we can update it with the newly generated container`)
          await GitUtils.gitClone(repoUrl, {destDirectory: 'ios'})

          shell.rm('-rf', `${paths.outDirectory}/*`)
        } else {
          log.warn('Looks like we are missing a GitHub publisher. Currently only GitHub publisher is supported.')
        }
      } else {
        log.debug('Will not publish since there is no publisher provided to generator.')
      }

      await this.fillContainerHull(plugins, miniapps, paths, mustacheView)

      if (miniapps.length > 0) {
        await bundleMiniApps(miniapps, paths, 'ios', {pathToYarnLock})
      }

      if (!this._containerGeneratorConfig.ignoreRnpmAssets) {
        this.copyRnpmAssets(miniapps, paths)
      }

      if (gitHubPublisher) {
        shell.cd(paths.outDirectory)
        log.debug(`Publish generated container[v${containerVersion}] to git repo: ${gitHubPublisher.url}`)
        await gitHubPublisher.publish({commitMessage: `Container v${containerVersion}`, tag: `v${containerVersion}`})
      }

      log.debug(`Container generation completed!`)
    } catch (e) {
      log.error(`[generateContainer] Something went wrong. Aborting Container Generation`)
      throw e
    }
  }

  copyRnpmAssets (
    miniApps: Array<MiniApp>,
    paths: any) {
    // Case of local container for runner
    if ((miniApps.length === 1) && (miniApps[0].path)) {
      this.copyRnpmAssetsFromMiniAppPath(miniApps[0].path, paths.outDirectory)
    } else {
      for (const miniApp of miniApps) {
        const miniAppPath = path.join(
          paths.compositeMiniApp,
          'node_modules',
          miniApp.packageJson.name)
        this.copyRnpmAssetsFromMiniAppPath(miniAppPath, paths.outDirectory)
      }
    }
    this.addResources(paths.outDirectory)
  }

  async addResources (outputDirectory: any) {
    log.debug(`=== ios: adding resources for miniapps`)
    const containerProjectPath = path.join(outputDirectory, 'ElectrodeContainer.xcodeproj', 'project.pbxproj')
    const containerIosProject = await this.getIosContainerProject(containerProjectPath)

    const containerResourcesPath = path.join(outputDirectory, 'ElectrodeContainer', 'Resources')
    readDir(containerResourcesPath, resourceFile => {
      containerIosProject.addResourceFile(path.join('Resources', resourceFile), null, containerIosProject.findPBXGroupKey({name: 'Resources'}))
    })
    log.debug(`---iOS: Finished adding resource files. `)

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())
  }

  copyRnpmAssetsFromMiniAppPath (miniAppPath: string, outputPath: string) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(miniAppPath, 'package.json'), 'utf-8'))
    if (packageJson.rnpm && packageJson.rnpm.assets) {
      for (const assetDirectoryName of packageJson.rnpm.assets) {
        const source = path.join(assetDirectoryName, '*')
        const dest = path.join('ElectrodeContainer', 'Resources')
        handleCopyDirective(miniAppPath, outputPath, [{ source, dest }])
      }
    }
  }

  async fillContainerHull (
    plugins: Array<Dependency>,
    miniApps: Array<MiniApp>,
    paths: any,
    mustacheView: any) : Promise<*> {
    log.debug(`[=== Starting container hull filling ===]`)
    shell.cd(`${ROOT_DIR}`)

    const copyFromPath = path.join(paths.containerHull, '{.*,*}')

    shell.cp('-R', copyFromPath, paths.outDirectory)
    await this.buildiOSPluginsViews(plugins, mustacheView)

    log.debug(`---iOS: reading template files to be rendered for plugins`)
    const files = readDir(paths.outDirectory, (f) => (f))
    for (const file of files) {
      if ((file.endsWith('.h') || file.endsWith('.m'))) {
        const pathToOutputFile = path.join(paths.outDirectory, file)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
          pathToOutputFile, mustacheView, pathToOutputFile)
      }
    }

    const containerProjectPath = path.join(paths.outDirectory, 'ElectrodeContainer.xcodeproj', 'project.pbxproj')
    const containerLibrariesPath = path.join(paths.outDirectory, 'ElectrodeContainer', 'Libraries')

    const containerIosProject = await this.getIosContainerProject(containerProjectPath)
    const electrodeContainerTarget = containerIosProject.findTargetKey('ElectrodeContainer')

    for (const plugin of plugins) {
      const pluginConfig = await manifest.getPluginConfig(plugin)
      shell.cd(paths.pluginsDownloadDirectory)
      if (pluginConfig.ios) {
        log.debug(`Retrieving ${plugin.scopedName}`)
        const pluginSourcePath = await downloadPluginSource(pluginConfig.origin)
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.scopedName}`)
        }

        if (pluginConfig.ios.copy) {
          for (let copy of pluginConfig.ios.copy) {
            if (this.switchToOldDirectoryStructure(pluginSourcePath, copy.source)) {
              log.debug(`Handling copy directive: Falling back to old directory structure for API(Backward compatibility)`)
              copy.source = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
            }
          }
          handleCopyDirective(pluginSourcePath, paths.outDirectory, pluginConfig.ios.copy)
        }

        if (pluginConfig.ios.replaceInFile) {
          for (const r of pluginConfig.ios.replaceInFile) {
            const pathToFile = path.join(paths.outDirectory, r.path)
            const fileContent = fs.readFileSync(pathToFile, 'utf8')
            const patchedFileContent = fileContent.replace(RegExp(r.string, 'g'), r.replaceWith)
            fs.writeFileSync(pathToFile, patchedFileContent, { encoding: 'utf8' })
          }
        }

        if (pluginConfig.ios.pbxproj) {
          if (pluginConfig.ios.pbxproj.addSource) {
            for (const source of pluginConfig.ios.pbxproj.addSource) {
              // Multiple source files
              if (source.from) {
                if (this.switchToOldDirectoryStructure(pluginSourcePath, source.from)) {
                  log.debug(`Source Copy: Falling back to old directory structure for API(Backward compatibility)`)
                  source.from = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs', '*.swift')
                }
                const relativeSourcePath = path.dirname(source.from)
                const pathToSourceFiles = path.join(pluginSourcePath, relativeSourcePath)
                const fileNames = _.filter(fs.readdirSync(pathToSourceFiles), f => f.endsWith(path.extname(source.from)))
                for (const fileName of fileNames) {
                  const fileNamePath = path.join(source.path, fileName)
                  containerIosProject.addSourceFile(fileNamePath, null, containerIosProject.findPBXGroupKey({name: source.group}))
                }
              } else {
                // Single source file
                containerIosProject.addSourceFile(source.path, null, containerIosProject.findPBXGroupKey({name: source.group}))
              }
            }
          }

          if (pluginConfig.ios.pbxproj.addHeader) {
            for (const header of pluginConfig.ios.pbxproj.addHeader) {
              let headerPath = header.path
              containerIosProject.addHeaderFile(headerPath, { public: header.public }, containerIosProject.findPBXGroupKey({name: header.group}))
            }
          }

          if (pluginConfig.ios.pbxproj.addFile) {
            for (const file of pluginConfig.ios.pbxproj.addFile) {
              containerIosProject.addFile(file.path, containerIosProject.findPBXGroupKey({name: file.group}))
              // Add target dep in any case for now, will rework later
              containerIosProject.addTargetDependency(electrodeContainerTarget, [`"${path.basename(file.path)}"`])
            }
          }

          if (pluginConfig.ios.pbxproj.addFramework) {
            for (const framework of pluginConfig.ios.pbxproj.addFramework) {
              containerIosProject.addFramework(framework, {sourceTree: 'BUILT_PRODUCTS_DIR', customFramework: true})
              containerIosProject.addCopyfileFrameworkCustom(framework)
            }
          }

          if (pluginConfig.ios.pbxproj.addProject) {
            for (const project of pluginConfig.ios.pbxproj.addProject) {
              const projectAbsolutePath = path.join(containerLibrariesPath, project.path, 'project.pbxproj')
              containerIosProject.addProject(projectAbsolutePath, project.path, project.group, electrodeContainerTarget, project.staticLibs)
            }
          }

          if (pluginConfig.ios.pbxproj.addStaticLibrary) {
            for (const lib of pluginConfig.ios.pbxproj.addStaticLibrary) {
              containerIosProject.addStaticLibrary(lib)
            }
          }

          if (pluginConfig.ios.pbxproj.addHeaderSearchPath) {
            for (const path of pluginConfig.ios.pbxproj.addHeaderSearchPath) {
              containerIosProject.addToHeaderSearchPaths(path)
            }
          }

          if (pluginConfig.ios.pbxproj.addFrameworkReference) {
            for (const frameworkReference of pluginConfig.ios.pbxproj.addFrameworkReference) {
              containerIosProject.addFramework(frameworkReference, { customFramework: true })
            }
          }
        }
      }
    }

    await this.addiOSPluginHookClasses(containerIosProject, plugins, paths)
    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())

    log.debug(`[=== Completed container hull filling ===]`)
  }

  // Code to keep backward compatibility
  switchToOldDirectoryStructure (pluginSourcePath: string, tail: string): boolean {
    // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
    const pathToSwaggersAPIs = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
    if (path.dirname(tail) === `IOS` && fs.existsSync(path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs)))) {
      return true
    }
    return false
  }

  async buildiOSPluginsViews (
    plugins: Array<Dependency>,
    mustacheView: any) : Promise<*> {
    try {
      let pluginsView = []
      log.debug(`===iOS: building iOS plugin views`)
      for (const plugin of plugins) {
        if (plugin.name === 'react-native') {
          continue
        }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        let iosPluginHook = pluginConfig.ios.pluginHook
        let containerHeader = pluginConfig.ios.containerPublicHeader
        if (iosPluginHook.configurable) {
          pluginsView.push({
            'name': iosPluginHook.name,
            'lcname': iosPluginHook.name.charAt(0).toLowerCase() + iosPluginHook.name.slice(1),
            'configurable': iosPluginHook.configurable,
            'containerHeader': containerHeader
          })
        } else {
          pluginsView.push({
            'configurable': iosPluginHook.configurable,
            'containerHeader': containerHeader
          })
        }
      }

      mustacheView.plugins = pluginsView
    } catch (e) {
      log.error('[buildiOSPluginsViews] Something went wrong: ' + e)
      throw e
    }
  }

  async addiOSPluginHookClasses (
    containerIosProject: any,
    plugins: Array<Dependency>,
    paths: any) : Promise<*> {
    try {
      log.debug(`[=== iOS: Adding plugin hook classes ===]`)

      for (const plugin of plugins) {
        if (plugin.name === 'react-native') { continue }
        let pluginConfig = await manifest.getPluginConfig(plugin)
        if (!pluginConfig.ios) {
          log.warn(`${plugin.name} does not have any injection configuration for iOS`)
          continue
        }
        let iOSPluginHook = pluginConfig.ios.pluginHook
        if (iOSPluginHook) {
          if (iOSPluginHook.header) {
            log.debug(`Adding ${iOSPluginHook.name}.h`)
            if (!pluginConfig.path) {
              throw new Error(`No plugin config path was set. Cannot proceed.`)
            }
            const pathToPluginHookHeader = path.join(pluginConfig.path, `${iOSPluginHook.name}.h`)
            const pathToCopyPluginHookHeaderTo = path.join(paths.outDirectory, 'ElectrodeContainer')
            shell.cp(pathToPluginHookHeader, pathToCopyPluginHookHeaderTo)
            containerIosProject.addHeaderFile(`${iOSPluginHook.name}.h`, { public: true }, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
            containerIosProject.addSourceFile(`${iOSPluginHook.name}.m`, null, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
          }

          if (iOSPluginHook.source) {
            log.debug(`Adding ${iOSPluginHook.name}.m`)
            if (!pluginConfig.path) {
              throw new Error(`No plugin config path was set. Cannot proceed.`)
            }
            const pathToPluginHookSource = path.join(pluginConfig.path, `${iOSPluginHook.name}.m`)
            const pathToCopyPluginHookSourceTo = path.join(paths.outDirectory, 'ElectrodeContainer')
            shell.cp(pathToPluginHookSource, pathToCopyPluginHookSourceTo)
          }
        }
      }

      log.debug(`[=== iOS: Done adding plugin hook classes ===]`)
    } catch (e) {
      log.error('[addiOSPluginHookClasses] Something went wrong: ' + e)
      throw e
    }
  }

  async getIosContainerProject (containerProjectPath: string) : Promise<*> {
    const containerProject = xcode.project(containerProjectPath)
    return new Promise((resolve, reject) => {
      containerProject.parse(function (err) {
        if (err) {
          reject(err)
        }
        resolve(containerProject)
      })
    })
  }
}

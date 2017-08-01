// @flow

import {
  pluginUtil,
  handleCopyDirective
} from 'ern-core'
import {
  Dependency,
  mustacheUtils
} from 'ern-util'
import {
  bundleMiniApps,
  downloadPluginSource,
  gitAdd,
  gitClone,
  gitCommit,
  gitPush,
  gitTag,
  spin,
  throwIfShellCommandFailed
} from '../../utils.js'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import xcode from '@walmart/xcode-ern'
import readDir from 'fs-readdir-recursive'

const ROOT_DIR = shell.pwd()

export default class GithubGenerator {
  _targetRepoUrl: string

  constructor ({
    targetRepoUrl
  } : {
    targetRepoUrl: string
  } = {}) {
    this._targetRepoUrl = targetRepoUrl
  }

  get name () : string {
    return 'GithubGenerator'
  }

  get platform () : string {
    return 'ios'
  }

  get targetRepoUrl () : string {
    return this._targetRepoUrl
  }

  async generateContainer (
    containerVersion: string,
    nativeAppName: string,
    plugins: Array<Dependency>,
    miniapps: any,
    paths: any,
    mustacheView: any) : Promise<*> {
    try {
      log.debug(`\n === Using github generator
          targetRepoUrl: ${this.targetRepoUrl}
          containerVersion: ${containerVersion}`)

      // Enhance mustache view with ios specifics
      mustacheView.ios = {
        targetRepoUrl: this.targetRepoUrl,
        containerVersion
      }

      // Clone target output Git repo
      shell.cd(paths.outFolder)
      throwIfShellCommandFailed()
      if (mustacheView.ios.targetRepoUrl) {
        await gitClone(mustacheView.ios.targetRepoUrl, { destFolder: 'ios' })
      }

      shell.rm('-rf', `${paths.outFolder}/ios/*`)
      throwIfShellCommandFailed()

      //
      // Go through all ern-container-gen steps
      //

      // Copy iOS container hull to generation ios output folder
      await this.fillContainerHull(plugins, miniapps, paths, mustacheView)

      // Bundle all the miniapps together and store resulting bundle in container
      // project
      if (miniapps.length > 0) {
        await bundleMiniApps(miniapps, paths, 'ios')
      }

      shell.cd(`${paths.outFolder}/ios`)
      throwIfShellCommandFailed()

      // Publish resulting container to git repo
      if (mustacheView.ios.targetRepoUrl) {
        await gitAdd()
        await gitCommit(`Container v${containerVersion}`)
        await gitTag(`v${containerVersion}`)
        await gitPush({force: true, tags: true})
      }

      // Finally, container hull project is fully generated, now let's just
      // build it and publish resulting AAR
      // await publishIosContainer(paths)
    } catch (e) {
      log.error(`Something went wrong. Aborting ern-container-gen: ${e}`)
      console.trace(e)
    }
  }

  async fillContainerHull (
    plugins: Array<Dependency>,
    miniApps: any,
    paths: any,
    mustacheView: any) : Promise<*> {
    log.debug(`[=== Starting container hull filling ===]`)

    shell.cd(`${ROOT_DIR}`)
    throwIfShellCommandFailed()

    const outputFolder = `${paths.outFolder}/ios`

    log.debug(`Creating out folder and copying Container Hull to it`)
    shell.cp('-R', `${paths.containerHull}/ios`, paths.outFolder)
    throwIfShellCommandFailed()

    await this.buildiOSPluginsViews(plugins, mustacheView)

    log.debug(`---iOS: reading template files to be rendered for plugins`)
    const files = readDir(`${outputFolder}`, (f) => (f))
    for (const file of files) {
      if ((file.endsWith('.h') || file.endsWith('.m'))) {
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
          `${outputFolder}/${file}`, mustacheView, `${outputFolder}/${file}`)
      }
    }

    const containerProjectPath = `${outputFolder}/ElectrodeContainer.xcodeproj/project.pbxproj`
    const containerLibrariesPath = `${outputFolder}/ElectrodeContainer/Libraries`

    const containerIosProject = await this.getIosContainerProject(containerProjectPath)
    const electrodeContainerTarget = containerIosProject.findTargetKey('ElectrodeContainer')

    for (const plugin of plugins) {
      const pluginConfig = await pluginUtil.getPluginConfig(plugin)
      shell.cd(`${paths.pluginsDownloadFolder}`)
      throwIfShellCommandFailed()
      if (pluginConfig.ios) {
        const pluginSourcePath = await spin(`Retrieving ${plugin.scopedName}`,
          downloadPluginSource(pluginConfig.origin))
        if (!pluginSourcePath) {
          throw new Error(`Was not able to download ${plugin.scopedName}`)
        }

        if (pluginConfig.ios.copy) {
          handleCopyDirective(pluginSourcePath, outputFolder, pluginConfig.ios.copy)
        }

        if (pluginConfig.ios.replaceInFile) {
          for (const r of pluginConfig.ios.replaceInFile) {
            const fileContent = fs.readFileSync(`${outputFolder}/${r.path}`, 'utf8')
            const patchedFileContent = fileContent.replace(r.string, r.replaceWith)
            fs.writeFileSync(`${outputFolder}/${r.path}`, patchedFileContent, { encoding: 'utf8' })
          }
        }

        if (pluginConfig.ios.pbxproj) {
          if (pluginConfig.ios.pbxproj.addSource) {
            for (const source of pluginConfig.ios.pbxproj.addSource) {
              // Multiple source files
              if (source.from) {
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
              const projectAbsolutePath = `${containerLibrariesPath}/${project.path}/project.pbxproj`
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
        }
      }
    }

    await this.addiOSPluginHookClasses(containerIosProject, plugins, paths)
    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())

    log.debug(`[=== Completed container hull filling ===]`)
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
        let pluginConfig = await pluginUtil.getPluginConfig(plugin)
        let iosPluginHook = pluginConfig.ios.pluginHook
        let containerHeader = pluginConfig.ios.containerPublicHeader
        if (iosPluginHook) {
          pluginsView.push({
            'name': iosPluginHook.name,
            'lcname': iosPluginHook.name.charAt(0).toLowerCase() + iosPluginHook.name.slice(1),
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
        let pluginConfig = await pluginUtil.getPluginConfig(plugin)
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
            shell.cp(`${pluginConfig.path}/${iOSPluginHook.name}.h`,
              `${paths.outFolder}/ios/ElectrodeContainer/`)
            throwIfShellCommandFailed()
            containerIosProject.addHeaderFile(`${iOSPluginHook.name}.h`, { public: true }, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
            containerIosProject.addSourceFile(`${iOSPluginHook.name}.m`, null, containerIosProject.findPBXGroupKey({name: 'ElectrodeContainer'}))
          }

          if (iOSPluginHook.source) {
            log.debug(`Adding ${iOSPluginHook.name}.m`)
            if (!pluginConfig.path) {
              throw new Error(`No plugin config path was set. Cannot proceed.`)
            }
            shell.cp(`${pluginConfig.path}/${iOSPluginHook.name}.m`,
              `${paths.outFolder}/ios/ElectrodeContainer/`)
            throwIfShellCommandFailed()
          }
        }
      }

      log.debug(`[=== iOS: Done adding plugin hook classes ===]`)
    } catch (e) {
      log.error('[addAndroidPluginHookClasses] Something went wrong: ' + e)
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

import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import xcode from '@walmart/xcode-ern'

import {
  getPluginConfig,
  gitClone,
  gitAdd,
  gitTag,
  gitPush,
  gitCommit,
  bundleMiniApps,
  spin,
  downloadPluginSource,
  handleCopyDirective,
  throwIfShellCommandFailed
} from '../../utils.js'

const ROOT_DIR = shell.pwd()

export default class GithubGenerator {
  constructor({
    targetRepoUrl
  }) {
    this._targetRepoUrl = targetRepoUrl
  }

  get name() {
    return "GithubGenerator"
  }

  get platform() {
    return "ios"
  }

  get targetRepoUrl() {
    return this._targetRepoUrl
  }

   async generateContainer(
    containerVersion,
    nativeAppName,
    platformPath,
    plugins,
    miniapps,
    paths,
    mustacheView) {
     try {
      console.log(`\n === Using github generator
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
      await this.fillContainerHull(plugins, miniapps, paths)

      // Bundle all the miniapps together and store resulting bundle in container
      // project
      if (miniapps.length > 0) {
        await bundleMiniApps(miniapps, paths, plugins, 'ios')
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
      //await publishIosContainer(paths)
    } catch (e) {
      console.log(`Something went wrong. Aborting ern-container-gen: ${e}`)
      console.trace(e)
    }
  }

  async fillContainerHull(plugins, miniApps, paths) {
    console.log(`[=== Starting container hull filling ===]`)

    shell.cd(`${ROOT_DIR}`)
    throwIfShellCommandFailed()

    const outputFolder =`${paths.outFolder}/ios`

    console.log(`Creating out folder and copying Container Hull to it`)
    shell.cp('-R', `${paths.containerHull}/ios`, paths.outFolder)
    throwIfShellCommandFailed()

    const containerProjectPath = `${outputFolder}/ElectrodeContainer.xcodeproj/project.pbxproj`
    const containerLibrariesPath = `${outputFolder}/ElectrodeContainer/Libraries`

    const containerIosProject = await this.getIosContainerProject(containerProjectPath)
    const electrodeContainerTarget = containerIosProject.findTargetKey('ElectrodeContainer')

    for (const plugin of plugins) {
      const pluginConfig = await getPluginConfig(plugin, paths.containerPluginsConfig)
      shell.cd(`${paths.pluginsDownloadFolder}`)
      throwIfShellCommandFailed()
      if (pluginConfig.ios) {
        const pluginSourcePath = await spin(`Retrieving ${plugin.name}`,
          downloadPluginSource(pluginConfig.origin))

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
                  const fileNamePath = path.join(pathToSourceFiles, fileName)
                  containerIosProject.addSourceFile(path.join(source.path, fileName), null, containerIosProject.findPBXGroupKey({name: source.group}))
                }
              }
              // Single source file 
              else {
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

    fs.writeFileSync(containerProjectPath, containerIosProject.writeSync())

    console.log(`[=== Completed container hull filling ===]`)
  }

  async getIosContainerProject(containerProjectPath) {
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
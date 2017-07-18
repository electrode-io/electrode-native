import shell from 'shelljs'
import {
  pluginUtil,
  handleCopyDirective
} from '@walmart/ern-core'
import {
  Dependency,
  Utils
} from '@walmart/ern-util'

import ApiImplGeneratable from '../../ApiImplGeneratable'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import xcode from '@walmart/xcode-ern'

const {
  getPluginConfig
} = pluginUtil

export const ROOT_DIR = shell.pwd()

export default class ApiImplGithubGenerator implements ApiImplGeneratable {
  get name () : string {
    return 'ApiImplGithubGenerator'
  }

  get platform (): string {
    return 'ios'
  }

  async generate (paths : Object,
                  reactNativeVersion: string,
                  plugins : Array<Dependency>) {
    log.debug(`Starting project generation for ${this.platform}`)
    await this.fillHull(paths, reactNativeVersion, plugins)
  }

  async fillHull (paths: Object,
                  reactNativeVersion: string,
                  plugins: Array<Dependency>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)
      shell.cd(`${ROOT_DIR}`)
      Utils.throwIfShellCommandFailed()

      const outputFolder = path.join(paths.outFolder, `ios`)
      log.debug(`Creating out folder(${outputFolder}) for ios and copying container hull to it.`)
      shell.mkdir(outputFolder)

      Utils.throwIfShellCommandFailed()

      shell.cp(`-R`, path.join(paths.apiImplHull, `/ios/*`), outputFolder)
      Utils.throwIfShellCommandFailed()

      const apiImplProjectPath = `${outputFolder}/ElectrodeApiImpl.xcodeproj/project.pbxproj`
      const apiImplLibrariesPath = `${outputFolder}/ElectrodeApiImpl/Libraries`
      const apiImplProject = await this.getIosApiImplProject(apiImplProjectPath)
      const apiImplTarget = apiImplProject.findTargetKey('ElectrodeApiImpl')

      // For now react-native plugin is added manually for ios. There's another story to make it automatic
      const reactnativeplugin = new Dependency('react-native', {
        version: '0.42.0'
      })
      plugins.push(reactnativeplugin)
      for (const plugin of plugins) {
        const pluginConfig = await getPluginConfig(plugin, paths.pluginsConfigPath, `ElectrodeApiImpl`)
        Utils.throwIfShellCommandFailed()
        if (pluginConfig.ios) {
          let pluginSourcePath
          if (pluginConfig.origin.scope) {
            pluginSourcePath = `node_modules/@${pluginConfig.origin.scope}/${pluginConfig.origin.name}`
          } else {
            pluginSourcePath = `node_modules/${pluginConfig.origin.name}`
          }
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
              fs.writeFileSync(`${outputFolder}/${r.path}`, patchedFileContent, {encoding: 'utf8'})
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
                    apiImplProject.addSourceFile(fileNamePath, null, apiImplProject.findPBXGroupKey({name: source.group}))
                  }
                } else {
                  // Single source file
                  apiImplProject.addSourceFile(source.path, null, apiImplProject.findPBXGroupKey({name: source.group}))
                }
              }
            }

            if (pluginConfig.ios.pbxproj.addHeader) {
              for (const header of pluginConfig.ios.pbxproj.addHeader) {
                let headerPath = header.path

                apiImplProject.addHeaderFile(headerPath, {public: header.public}, apiImplProject.findPBXGroupKey({name: header.group}))
              }
            }

            if (pluginConfig.ios.pbxproj.addFile) {
              for (const file of pluginConfig.ios.pbxproj.addFile) {
                apiImplProject.addFile(file.path, apiImplTarget.findPBXGroupKey({name: file.group}))
                // Add target dep in any case for now, will rework later
                apiImplProject.addTargetDependency(apiImplTarget, [`"${path.basename(file.path)}"`])
              }
            }

            if (pluginConfig.ios.pbxproj.addFramework) {
              for (const framework of pluginConfig.ios.pbxproj.addFramework) {
                apiImplProject.addFramework(framework, {sourceTree: 'BUILT_PRODUCTS_DIR', customFramework: true})
                apiImplProject.addCopyfileFrameworkCustom(framework)
              }
            }

            if (pluginConfig.ios.pbxproj.addProject) {
              for (const project of pluginConfig.ios.pbxproj.addProject) {
                const projectAbsolutePath = `${apiImplLibrariesPath}/${project.path}/project.pbxproj`
                apiImplProject.addProject(projectAbsolutePath, project.path, project.group, apiImplTarget, project.staticLibs)
              }
            }

            if (pluginConfig.ios.pbxproj.addStaticLibrary) {
              for (const lib of pluginConfig.ios.pbxproj.addStaticLibrary) {
                apiImplProject.addStaticLibrary(lib)
              }
            }

            if (pluginConfig.ios.pbxproj.addHeaderSearchPath) {
              for (const path of pluginConfig.ios.pbxproj.addHeaderSearchPath) {
                apiImplTarget.addToHeaderSearchPaths(path)
              }
            }
          }
        }
      }

      fs.writeFileSync(apiImplProjectPath, apiImplProject.writeSync())

      log.debug(`[=== Completed api-impl hull filling ===]`)
    } catch (e) {
      Utils.logErrorAndExitProcess(`Error while generating api impl hull for ios: ${JSON.stringify(e)}`)
    }
  }

  async getIosApiImplProject (apiImplProjectPath: string) : Promise<*> {
    log.debug(apiImplProjectPath)

    const containerProject = xcode.project(apiImplProjectPath)

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

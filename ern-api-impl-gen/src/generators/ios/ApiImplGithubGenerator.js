
import {
  manifest,
  handleCopyDirective
} from 'ern-core'
import {
  Dependency,
  shell
} from 'ern-util'

import ApiImplGeneratable from '../../ApiImplGeneratable'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import xcode from 'xcode-ern'

export const ROOT_DIR = shell.pwd()

export default class ApiImplGithubGenerator implements ApiImplGeneratable {
  get name () : string {
    return 'ApiImplGithubGenerator'
  }

  get platform (): string {
    return 'ios'
  }

  async generate (apiDependency: Dependency,
                  paths : Object,
                  reactNativeVersion: string,
                  plugins : Array<Dependency>,
                  apis: Array<Object>,
                  regen: boolean) {
    log.debug(`Starting project generation for ${this.platform}`)
    await this.fillHull(paths, reactNativeVersion, plugins)
  }

  async fillHull (paths: Object,
                  reactNativeVersion: string,
                  plugins: Array<Dependency>) {
    try {
      log.debug(`[=== Starting hull filling for api impl gen for ${this.platform} ===]`)
      shell.cd(`${ROOT_DIR}`)

      const outputDirectory = path.join(paths.outDirectory, 'ios')
      log.debug(`Creating out directory(${outputDirectory}) for ios and copying container hull to it.`)
      if (!fs.existsSync(outputDirectory)) {
        shell.mkdir(outputDirectory)
      }
      shell.cp('-R', path.join(paths.apiImplHull, 'ios', '*'), outputDirectory)

      const apiImplProjectPath = path.join(outputDirectory, 'ElectrodeApiImpl.xcodeproj', 'project.pbxproj')
      const apiImplLibrariesPath = path.join(outputDirectory, 'ElectrodeApiImpl', 'Libraries')
      const apiImplProject = await this.getIosApiImplProject(apiImplProjectPath)
      const apiImplTarget = apiImplProject.findTargetKey('ElectrodeApiImpl')

      const reactnativeplugin = new Dependency('react-native', {
        version: reactNativeVersion
      })

      log.debug(`Manually injecting react-native(${reactnativeplugin}) plugin to dependencies.`)
      plugins.push(reactnativeplugin)

      for (const plugin: Dependency of plugins) {
        log.debug(`Copying ${plugin.name}`)
        const pluginConfig = await manifest.getPluginConfig(plugin, 'ElectrodeApiImpl')
        if (pluginConfig.ios) {
          let pluginSourcePath
          if (pluginConfig.origin.scope) {
            pluginSourcePath = path.join(paths.pluginsDownloadDirectory, 'node_modules', `@${pluginConfig.origin.scope}`, pluginConfig.origin.name)
          } else {
            pluginSourcePath = path.join(paths.pluginsDownloadDirectory, 'node_modules', pluginConfig.origin.name)
          }
          if (!pluginSourcePath) {
            throw new Error(`Was not able to download ${plugin.scopedName}`)
          }

          if (pluginConfig.ios.copy) {
            handleCopyDirective(pluginSourcePath, outputDirectory, pluginConfig.ios.copy)
          }

          if (pluginConfig.ios.replaceInFile) {
            for (const r of pluginConfig.ios.replaceInFile) {
              const fileContent = fs.readFileSync(`${outputDirectory}/${r.path}`, 'utf8')
              const patchedFileContent = fileContent.replace(RegExp(r.string, 'g'), r.replaceWith)
              fs.writeFileSync(path.join(outputDirectory, r.path), patchedFileContent, {encoding: 'utf8'})
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
                apiImplProject.addHeaderFile(headerPath, { public: header.public }, apiImplProject.findPBXGroupKey({name: header.group}))
              }
            }

            if (pluginConfig.ios.pbxproj.addFile) {
              for (const file of pluginConfig.ios.pbxproj.addFile) {
                apiImplProject.addFile(file.path, apiImplProject.findPBXGroupKey({name: file.group}))
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
                const projectAbsolutePath = path.join(apiImplLibrariesPath, project.path, 'project.pbxproj')
                const options = {
                  projectAbsolutePath,
                  staticLibs: project.staticLibs,
                  frameworks: project.frameworks
                }
                apiImplProject.addProject(project.path, project.group, apiImplTarget, options)
              }
            }

            if (pluginConfig.ios.pbxproj.addStaticLibrary) {
              for (const lib of pluginConfig.ios.pbxproj.addStaticLibrary) {
                apiImplProject.addStaticLibrary(lib)
              }
            }

            if (pluginConfig.ios.pbxproj.addHeaderSearchPath) {
              for (const p of pluginConfig.ios.pbxproj.addHeaderSearchPath) {
                apiImplProject.addToHeaderSearchPaths(p)
              }
            }

            if (pluginConfig.ios.pbxproj.addFrameworkReference) {
              for (const frameworkReference of pluginConfig.ios.pbxproj.addFrameworkReference) {
                apiImplProject.addFramework(frameworkReference, { customFramework: true })
              }
            }

            if (pluginConfig.ios.pbxproj.addFrameworkSearchPath) {
              for (const p of pluginConfig.ios.pbxproj.addFrameworkSearchPath) {
                apiImplProject.addToFrameworkSearchPaths(p)
              }
            }
          }
        }
      }

      fs.writeFileSync(apiImplProjectPath, apiImplProject.writeSync())

      log.debug('[=== Completed api-impl hull filling ===]')
    } catch (e) {
      log.error('Error while generating api impl hull for ios')
      throw e
    }
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

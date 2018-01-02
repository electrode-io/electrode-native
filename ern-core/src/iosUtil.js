import Dependency from './Dependency'
import * as mustacheUtils from './mustacheUtils'
import shell from './shell'
import manifest from './Manifest'
import handleCopyDirective from './handleCopyDirective'
import {
  downloadPluginSource,
  isDependencyJsApiImpl
} from './utils'
import readDir from 'fs-readdir-recursive'
import path from 'path'
import xcode from 'xcode-ern'
import fs from 'fs'
import _ from 'lodash'

export async function fillProjectHull
(pathSpec: {
   rootDir: string,
   projectHullDir: string,
   outputDir: string,
   pluginsDownloadDirectory: string
 },
 projectSpec: {
   projectName: string
 },
 plugins: Array<Dependency>,
 mustacheView?: any) {
  log.debug(`[=== Starting iOS framework project hull filling ===]`)
  shell.cd(pathSpec.rootDir)

  if (!fs.existsSync(pathSpec.outputDir)) {
    shell.mkdir(pathSpec.outputDir)
  }

  shell.cp('-R', pathSpec.projectHullDir, pathSpec.outputDir)

  if (mustacheView) {
    log.debug(`iOS: reading template files to be rendered for plugins`)
    const files = readDir(pathSpec.outputDir, (f) => (f))
    for (const file of files) {
      if ((file.endsWith('.h') || file.endsWith('.m'))) {
        const pathToOutputFile = path.join(pathSpec.outputDir, file)
        await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(pathToOutputFile, mustacheView, pathToOutputFile)
      }
    }
  }
  const projectPath = path.join(pathSpec.outputDir, `${projectSpec.projectName}.xcodeproj`, 'project.pbxproj')
  const librariesPath = path.join(pathSpec.outputDir, projectSpec.projectName, 'Libraries')
  const iosProject = await getIosProject(projectPath)
  const target = iosProject.findTargetKey(projectSpec.projectName)

  for (const plugin of plugins) {
    if (await isDependencyJsApiImpl(plugin)) {
      log.debug('JS api implementation identified, skipping fill hull.')
      continue
    }

    const pluginConfig = await
      manifest.getPluginConfig(plugin, projectSpec.projectName)
    shell.cd(pathSpec.pluginsDownloadDirectory)
    if (pluginConfig.ios) {
      log.debug(`Retrieving ${plugin.scopedName}`)
      const pluginSourcePath = await
        downloadPluginSource(pluginConfig.origin)
      if (!pluginSourcePath) {
        throw new Error(`Was not able to download ${plugin.scopedName}`)
      }

      if (pluginConfig.ios.copy) {
        for (let copy of pluginConfig.ios.copy) {
          if (switchToOldDirectoryStructure(pluginSourcePath, copy.source)) {
            log.debug(`Handling copy directive: Falling back to old directory structure for API(Backward compatibility)`)
            copy.source = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
          }
        }
        handleCopyDirective(pluginSourcePath, pathSpec.outputDir, pluginConfig.ios.copy)
      }

      if (pluginConfig.ios.replaceInFile) {
        for (const r of pluginConfig.ios.replaceInFile) {
          const pathToFile = path.join(pathSpec.outputDir, r.path)
          const fileContent = fs.readFileSync(pathToFile, 'utf8')
          const patchedFileContent = fileContent.replace(RegExp(r.string, 'g'), r.replaceWith)
          fs.writeFileSync(pathToFile, patchedFileContent, {encoding: 'utf8'})
        }
      }

      if (pluginConfig.ios.pbxproj) {
        if (pluginConfig.ios.pbxproj.addSource) {
          for (const source of pluginConfig.ios.pbxproj.addSource) {
            // Multiple source files
            if (source.from) {
              if (switchToOldDirectoryStructure(pluginSourcePath, source.from)) {
                log.debug(`Source Copy: Falling back to old directory structure for API(Backward compatibility)`)
                source.from = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs', '*.swift')
              }
              const relativeSourcePath = path.dirname(source.from)
              const pathToSourceFiles = path.join(pluginSourcePath, relativeSourcePath)
              const fileNames = _.filter(fs.readdirSync(pathToSourceFiles), f => f.endsWith(path.extname(source.from)))
              for (const fileName of fileNames) {
                const fileNamePath = path.join(source.path, fileName)
                iosProject.addSourceFile(fileNamePath, null, iosProject.findPBXGroupKey({name: source.group}))
              }
            } else {
              // Single source file
              iosProject.addSourceFile(source.path, null, iosProject.findPBXGroupKey({name: source.group}))
            }
          }
        }

        if (pluginConfig.ios.pbxproj.addHeader) {
          for (const header of pluginConfig.ios.pbxproj.addHeader) {
            let headerPath = header.path
            iosProject.addHeaderFile(headerPath, {public: header.public}, iosProject.findPBXGroupKey({name: header.group}))
          }
        }

        if (pluginConfig.ios.pbxproj.addFile) {
          for (const file of pluginConfig.ios.pbxproj.addFile) {
            iosProject.addFile(file.path, iosProject.findPBXGroupKey({name: file.group}))
            // Add target dep in any case for now, will rework later
            iosProject.addTargetDependency(target, [`"${path.basename(file.path)}"`])
          }
        }

        if (pluginConfig.ios.pbxproj.addFramework) {
          for (const framework of pluginConfig.ios.pbxproj.addFramework) {
            iosProject.addFramework(framework, {sourceTree: 'BUILT_PRODUCTS_DIR', customFramework: true})
            iosProject.addCopyfileFrameworkCustom(framework)
          }
        }

        if (pluginConfig.ios.pbxproj.addProject) {
          for (const project of pluginConfig.ios.pbxproj.addProject) {
            const projectAbsolutePath = path.join(librariesPath, project.path, 'project.pbxproj')
            const options = {
              projectAbsolutePath,
              staticLibs: project.staticLibs,
              frameworks: project.frameworks
            }
            iosProject.addProject(project.path, project.group, target, options)
          }
        }

        if (pluginConfig.ios.pbxproj.addStaticLibrary) {
          for (const lib of pluginConfig.ios.pbxproj.addStaticLibrary) {
            iosProject.addStaticLibrary(lib)
          }
        }

        if (pluginConfig.ios.pbxproj.addHeaderSearchPath) {
          for (const p of pluginConfig.ios.pbxproj.addHeaderSearchPath) {
            iosProject.addToHeaderSearchPaths(p)
          }
        }

        if (pluginConfig.ios.pbxproj.addFrameworkReference) {
          for (const frameworkReference of pluginConfig.ios.pbxproj.addFrameworkReference) {
            iosProject.addFramework(frameworkReference, {customFramework: true})
          }
        }

        if (pluginConfig.ios.pbxproj.addFrameworkSearchPath) {
          for (const p of pluginConfig.ios.pbxproj.addFrameworkSearchPath) {
            iosProject.addToFrameworkSearchPaths(p)
          }
        }
      }
    }
  }

  log.debug(`[=== Completed framework generation ===]`)
  return {iosProject, projectPath}
}

async function getIosProject (projectPath: string): Promise<*> {
  const project = xcode.project(projectPath)
  return new Promise((resolve, reject) => {
    project.parse(function (err) {
      if (err) {
        log.error(`failed to get ios project : ${JSON.stringify(err)}`)
        reject(err)
      }

      resolve(project)
    })
  })
}

function switchToOldDirectoryStructure (pluginSourcePath: string, tail: string): boolean {
  // This is to check if the api referenced during container generation is created using the old or new directory structure to help keep the backward compatibility.
  const pathToSwaggersAPIs = path.join('IOS', 'IOS', 'Classes', 'SwaggersAPIs')
  if (path.dirname(tail) === `IOS` && fs.existsSync(path.join(pluginSourcePath, path.dirname(pathToSwaggersAPIs)))) {
    return true
  }
  return false
}

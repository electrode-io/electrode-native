import {
  spin,
  PackagePath,
  shell,
  yarn,
  log,
  readPackageJsonSync,
  writePackageJsonSync,
} from 'ern-core'
import { ApiGenUtils } from 'ern-api-gen'
import _ from 'lodash'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import semver from 'semver'
import * as lockfile from '@yarnpkg/lockfile'
import ApiImplAndroidGenerator from './android/ApiImplAndroidGenerator'
import ApiImplIosGenerator from './ios/ApiImplIosGenerator'
import ApiImplJsGenerator from './js/ApiImplJsGenerator'
import NullApiImplGenerator from './NullApiImplGenerator'
import { ApiImplGeneratable } from '../ApiImplGeneratable'

let plugins: PackagePath[]

export default class ApiImplGen {
  public async generateApiImplementation(
    apiPackagePath: PackagePath,
    paths: {
      workingDirectory: string
      pluginsDownloadDirectory: string
      apiImplHull: string
      outDirectory: string
    },
    reactNativeVersion: string,
    platforms: string[],
    regen: boolean = false
  ) {
    log.debug(
      `Inside generateApiImplementation for api:${apiPackagePath.toString()},  platforms:${platforms.toString()}`
    )

    await this.downloadApiAndDependencies(
      apiPackagePath,
      paths.pluginsDownloadDirectory,
      reactNativeVersion
    )

    const schemaJson = path.join(
      paths.pluginsDownloadDirectory,
      'node_modules',
      apiPackagePath.basePath,
      'schema.json'
    )
    const apis: any[] = await ApiGenUtils.extractApiEventsAndRequests(
      schemaJson
    )
    this.updatePackageJsonWithApiNames(paths.outDirectory, apis)

    const generators: ApiImplGeneratable[] = this.getGenerators(platforms)
    for (const generator of generators) {
      try {
        if (generator) {
          await generator.generate(
            apiPackagePath,
            paths,
            reactNativeVersion,
            plugins,
            apis,
            regen
          )
        }
      } catch (e) {
        throw new Error(`API implementation project generation failed: ${e}`)
      }
    }

    log.info(
      chalk.green(
        `API implementation project was successfully generated in ${
          paths.outDirectory
        }`
      )
    )
  }

  public async downloadApiAndDependencies(
    apiPackagePath: PackagePath,
    downloadPath: string,
    reactNativeVersion: string
  ) {
    try {
      shell.pushd(downloadPath)

      await this.spinAndDownload(apiPackagePath)
      plugins = await this.getDependencies(apiPackagePath)
      plugins.push(apiPackagePath) // Also add the api as a plugin so it's src files will get copied.
      const pluginsWithResolvedVersions: PackagePath[] = []
      if (plugins) {
        log.info('Downloading dependencies')
        for (const dependency of plugins) {
          await this.spinAndDownload(dependency)

          // Not very pretty, should find a better design, was just to avoid too
          // much refactoring at this point
          // Problem here is with mostly with the bridge dependency which version
          // is specified as a range and not a fixed one (ie 1.5.x for example)
          // The problem is that later on, manifest expect a fixed version to
          // lookup for the correct plugin configuration, and not a range
          // We therefore update the plugin version with the one that was
          // actually installed and not the range specified in package.json
          if (!semver.valid(dependency.version!)) {
            // Not a valid version. Given that it was sucessfuly installed
            // it means that it is a range, and not a fixed version.
            // Let's find out what version was actually installed by looking
            // in the yarn.lock
            const yarnLock = fs.readFileSync(
              path.join(downloadPath, 'yarn.lock'),
              'utf8'
            )
            const yarnLockJson = lockfile.parse(yarnLock)
            const installedDependency = _.find(
              Object.keys(yarnLockJson.object),
              d => d.startsWith(`${dependency.basePath}@`)
            )
            const installedDependencyVersion =
              yarnLockJson.object[installedDependency].version
            const pluginWithResolvedVersion = PackagePath.fromString(
              `${dependency.basePath}@${installedDependencyVersion}`
            )
            pluginsWithResolvedVersions.push(pluginWithResolvedVersion)

            log.debug(
              `Replacing plugin ${dependency.basePath} range version ${
                dependency.version
              } with real resolved version ${installedDependencyVersion}`
            )
          } else {
            pluginsWithResolvedVersions.push(dependency)
          }
        }
      }
      // Replace plugins array with the one containing real valid plugin versions
      plugins = pluginsWithResolvedVersions
      log.debug('Downloading react-native dependency')
      await this.spinAndDownload(
        new PackagePath(`react-native@${reactNativeVersion}`)
      )
    } catch (e) {
      throw new Error(`Api dependency download failed: ${e}`)
    } finally {
      shell.popd()
    }
  }

  public async spinAndDownload(dependency: PackagePath) {
    await spin(`Downloading ${dependency.toString()}`, yarn.add(dependency))
  }

  public async getDependencies(
    apiPackagePath: PackagePath
  ): Promise<PackagePath[]> {
    try {
      log.info('Looking for peerDependencies')
      const apiPackageInfo = await yarn.info(apiPackagePath, { json: true })

      const pluginsNames = []

      if (apiPackageInfo.data.peerDependencies) {
        this.pushDependencyNames(
          apiPackageInfo.data.peerDependencies,
          pluginsNames
        )
      }

      if (apiPackageInfo.data.dependencies) {
        this.pushDependencyNames(apiPackageInfo.data.dependencies, pluginsNames)
      }

      if (pluginsNames.length === 0) {
        log.info(`no other dependencies found for ${apiPackagePath.basePath}`)
      }
      return _.map(pluginsNames, PackagePath.fromString)
    } catch (e) {
      throw new Error(`getDependencies: ${e}`)
    }
  }

  public pushDependencyNames(
    dependencies: any,
    pluginsNames: string[]
  ): string[] {
    for (const dependency of Object.keys(dependencies)) {
      pluginsNames.push(`${dependency}@${dependencies[dependency]}`)
    }
    return pluginsNames
  }

  public getGenerators(platforms: string[]): ApiImplGeneratable[] {
    return _.map(platforms, (platform: string) => {
      switch (platform) {
        case 'android':
          return new ApiImplAndroidGenerator()
        case 'ios':
          return new ApiImplIosGenerator()
        case 'js':
          return new ApiImplJsGenerator()
        default:
          return new NullApiImplGenerator()
      }
    })
  }

  public updatePackageJsonWithApiNames(
    outputDirectoryPath: string,
    apis: any[]
  ) {
    const packageJson = readPackageJsonSync(outputDirectoryPath)
    packageJson.ern.containerGen.apiNames = _.map(apis, api => api.apiName)
    writePackageJsonSync(outputDirectoryPath, packageJson)
  }
}

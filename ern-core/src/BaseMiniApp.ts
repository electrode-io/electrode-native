import { PackagePath } from './PackagePath'
import { readPackageJsonSync } from './packageJsonFileUtils'
import { tagOneLine } from './tagoneline'
import * as utils from './utils'
import fs from 'fs'
import path from 'path'
import log from './log'
import _ from 'lodash'

export class BaseMiniApp {
  public readonly path: string
  public readonly packageJson: any
  public readonly packagePath: PackagePath

  constructor({
    miniAppPath,
    packagePath,
  }: {
    miniAppPath: string
    packagePath: PackagePath
  }) {
    this.path = miniAppPath

    const packageJsonPath = path.join(miniAppPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`This command should be run at the root of a mini-app`)
    }

    const packageJson = readPackageJsonSync(miniAppPath)
    if (packageJson.ernPlatformVersion) {
      // TO REMOVE IN ERN 0.5.0
      log.warn(`
=================================================================
ernPlatformVersion will be deprecated soon
Please replace 
  "ernPlatformVersion" : "${packageJson.ernPlatformVersion}" 
with 
  "ern" : { "version" : "${packageJson.ernPlatformVersion}" }
in the package.json of ${packageJson.name} MiniApp
=================================================================`)
    } else if (!packageJson.ern) {
      throw new Error(
        tagOneLine`No ern section found in ${
          packageJson.name
        } package.json. Are you sure this is a MiniApp ?`
      )
    }

    this.packageJson = packageJson
    this.packagePath = packagePath
  }

  get name(): string {
    if (this.packageJson.ern) {
      if (this.packageJson.ern.miniAppName) {
        return this.packageJson.ern.miniAppName
      } else if (this.packageJson.ern.moduleName) {
        return this.packageJson.ern.moduleName
      }
    }
    return this.getUnscopedModuleName(this.packageJson.name)
  }

  public getUnscopedModuleName(moduleName: string): string {
    const npmScopeModuleRe = /(@.*)\/(.*)/
    return npmScopeModuleRe.test(moduleName)
      ? npmScopeModuleRe.exec(moduleName)![2]
      : moduleName
  }

  get normalizedName(): string {
    return this.name.replace(/-/g, '')
  }

  get pascalCaseName(): string {
    return `${this.normalizedName
      .charAt(0)
      .toUpperCase()}${this.normalizedName.slice(1)}`
  }

  get scope(): string | void {
    const scopeCapture = /^@(.*)\//.exec(this.packageJson.name)
    if (scopeCapture) {
      return scopeCapture[1]
    }
  }

  get version(): string {
    return this.packageJson.version
  }

  get platformVersion(): string {
    return this.packageJson.ern
      ? this.packageJson.ern.version
      : this.packageJson.ernPlatformVersion
  }

  get packageDescriptor(): string {
    return `${this.packageJson.name}@${this.packageJson.version}`
  }

  public async isPublishedToNpm(): Promise<boolean> {
    return utils.isPublishedToNpm(
      PackagePath.fromString(
        `${this.packageJson.name}@${this.packageJson.version}`
      )
    )
  }

  public getPackageJsonDependencies(): PackagePath[] {
    return _.map(this.packageJson.dependencies, (val: string, key: string) =>
      PackagePath.fromString(`${key}@${val}`)
    )
  }
}

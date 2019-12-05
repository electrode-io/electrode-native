import { PackagePath } from './PackagePath'
import { readPackageJsonSync } from './packageJsonFileUtils'
import { tagOneLine } from './tagoneline'
import { PackageManager } from './PackageManager'
import * as utils from './utils'
import fs from 'fs'
import path from 'path'
import log from './log'
import _ from 'lodash'
import Platform from './Platform'

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
        tagOneLine`No ern section found in ${packageJson.name} package.json. Are you sure this is a MiniApp ?`
      )
    }

    this.packageJson = packageJson
    this.packagePath = packagePath
  }

  get name(): string {
    return (
      this.packageJson.ern?.miniAppName ??
      this.packageJson.ern?.moduleName ??
      this.getUnscopedModuleName(this.packageJson.name)
    )
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
    return this.packageJson.ern?.version ?? this.packageJson.ernPlatformVersion
  }

  get packageDescriptor(): string {
    return `${this.packageJson.name}@${this.packageJson.version}`
  }

  get packageManager(): PackageManager {
    // Use ern.packageManager value from package.json if set
    const ernPackageManager = this.packageJson.ern.packageManager
    if (ernPackageManager) {
      if (ernPackageManager === 'npm') {
        return PackageManager.npm()
      } else if (ernPackageManager === 'yarn') {
        return PackageManager.yarn()
      } else {
        throw new Error(
          `Invalid ern.packageManager value in package.json : ${ernPackageManager}.
Should be either yarn or npm`
        )
      }
    }
    // Otherwise favor yarn if it is installed
    else if (Platform.isYarnInstalled()) {
      return PackageManager.yarn()
    }
    // Finally fallback to npm
    else {
      return PackageManager.npm()
    }
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

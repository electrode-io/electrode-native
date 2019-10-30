import config, { ErnConfig } from './config'

export interface PackageLink {
  localPath: string
  isEnabled: boolean
}
export interface PackagesLinks {
  [packageName: string]: PackageLink
}

export const packagesLinksConfigKey = 'packagesLinks'

export class PackageLinksConfig {
  private readonly links: PackagesLinks

  constructor(private readonly conf: ErnConfig) {
    this.links = this.conf.get(packagesLinksConfigKey, {})
  }

  public add(packageName: string, localPath: string): PackageLink {
    this.throwIfPackageLinkExist(packageName)
    const link = {
      isEnabled: true,
      localPath,
    }
    this.links[packageName] = link
    this.persist()
    return link
  }

  public has(packageName: string): boolean {
    return !!this.links[packageName]
  }

  public get(packageName: string): PackageLink {
    this.throwIfPackageLinkIdDoesNotExist(packageName)
    return this.links[packageName]
  }

  public getAll(): PackagesLinks {
    return JSON.parse(JSON.stringify(this.links))
  }

  public isEnabled(packageName: string): boolean {
    this.throwIfPackageLinkIdDoesNotExist(packageName)
    return this.links[packageName].isEnabled
  }

  public remove(packageName: string): PackageLink {
    this.throwIfPackageLinkIdDoesNotExist(packageName)
    const deletedLink = this.links[packageName]
    delete this.links[packageName]
    this.persist()
    return deletedLink
  }

  public disable(packageName: string): PackageLink {
    this.throwIfPackageLinkIdDoesNotExist(packageName)
    const disabledLink = this.links[packageName]
    this.links[packageName].isEnabled = false
    this.persist()
    return disabledLink
  }

  public enable(packageName: string): PackageLink {
    this.throwIfPackageLinkIdDoesNotExist(packageName)
    const enabledLink = this.links[packageName]
    this.links[packageName].isEnabled = true
    this.persist()
    return enabledLink
  }

  public update(packageName: string, newPath: string): PackageLink {
    this.throwIfPackageLinkIdDoesNotExist(packageName)
    this.links[packageName].localPath = newPath
    this.persist()
    return this.links[packageName]
  }

  private persist() {
    this.conf.set(packagesLinksConfigKey, this.links)
  }

  private throwIfPackageLinkExist(packageName: string) {
    if (this.has(packageName)) {
      throw new Error(`Package ${packageName} is already linked`)
    }
  }

  private throwIfPackageLinkIdDoesNotExist(packageName: string) {
    if (!this.has(packageName)) {
      throw new Error(`No package link exist for package name ${packageName}`)
    }
  }
}

export const packageLinksConfig = new PackageLinksConfig(config)

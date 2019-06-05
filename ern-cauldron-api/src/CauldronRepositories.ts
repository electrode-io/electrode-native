import { Platform, config, shell } from 'ern-core'
import { CauldronRepository } from './types'

export class CauldronRepositories {
  public add(
    alias: string,
    url: string,
    {
      activate,
    }: {
      activate?: boolean
    }
  ): CauldronRepository {
    this.throwIfAliasExist({ alias })

    const supportedGitHttpsSchemeRe = /(^https:\/\/.+:.+@.+$)|(^https:\/\/.+@.+$)/
    if (url.startsWith('https')) {
      if (!supportedGitHttpsSchemeRe.test(url)) {
        throw new Error(`Cauldron https urls have to be formatted as : 
https://[username]:[password]@[repourl]
OR
https://[token]@[repourl]`)
      }
    }

    const cauldronRepositories = config.getValue('cauldronRepositories', {})
    cauldronRepositories[alias] = url
    config.setValue('cauldronRepositories', cauldronRepositories)
    if (activate) {
      this.activate({ alias })
    }
    return { alias, url }
  }

  public doesExist({ alias }: { alias: string }) {
    const cauldronRepositories = config.getValue('cauldronRepositories', {})
    return cauldronRepositories[alias] !== undefined
  }

  public remove({ alias }: { alias: string }): CauldronRepository {
    this.throwIfAliasDoesNotExist({ alias })
    const cauldronRepositories = config.getValue('cauldronRepositories')
    const result = { alias, url: cauldronRepositories[alias] }
    delete cauldronRepositories[alias]
    config.setValue('cauldronRepositories', cauldronRepositories)
    const cauldronRepoInUse = config.getValue('cauldronRepoInUse')
    if (cauldronRepoInUse === alias) {
      config.setValue('cauldronRepoInUse', null)
    }
    return result
  }

  public list(): CauldronRepository[] {
    const repositories = config.getValue('cauldronRepositories', {})
    return repositories
      ? Object.keys(repositories).map(alias => ({
          alias,
          url: repositories[alias],
        }))
      : []
  }

  public get current(): CauldronRepository | void {
    const alias = config.getValue('cauldronRepoInUse')
    if (alias) {
      const repositories = config.getValue('cauldronRepositories', {})
      const url = repositories[alias]
      if (url) {
        return {
          alias,
          url,
        }
      }
    }
  }

  public activate({ alias }: { alias: string }) {
    this.throwIfAliasDoesNotExist({ alias })
    this.updateCauldronRepoInUse({ alias })
  }
  public deactivate() {
    this.updateCauldronRepoInUse()
  }

  private updateCauldronRepoInUse({ alias }: { alias?: string } = {}) {
    config.setValue('cauldronRepoInUse', alias)
    shell.rm('-rf', Platform.cauldronDirectory)
  }

  private throwIfAliasExist({ alias }: { alias: string }) {
    if (this.doesExist({ alias })) {
      throw new Error(
        `A Cauldron repository already exists with ${alias} alias`
      )
    }
  }

  private throwIfAliasDoesNotExist({ alias }: { alias: string }) {
    if (!this.doesExist({ alias })) {
      throw new Error(`Cauldron repository ${alias} does not exist`)
    }
  }
}

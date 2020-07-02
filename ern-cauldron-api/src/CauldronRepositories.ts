import { config, Platform, sortObjectByKeys, shell } from 'ern-core';
import { CauldronRepository } from './types';

export class CauldronRepositories {
  public add(
    alias: string,
    url: string,
    {
      activate,
      force,
    }: {
      activate?: boolean;
      force?: boolean;
    },
  ): CauldronRepository {
    if (!force) {
      this.throwIfAliasExist({ alias });
    }

    const supportedGitHttpsSchemeRe = /(^https:\/\/.+:.+@.+$)|(^https:\/\/.+@.+$)/;
    if (url.startsWith('https')) {
      if (!supportedGitHttpsSchemeRe.test(url)) {
        throw new Error(`Cauldron https urls have to be formatted as:
https://[username]:[password]@[repourl]
OR
https://[token]@[repourl]`);
      }
    }

    const cauldronRepositories = config.get('cauldronRepositories', {});
    cauldronRepositories[alias] = url;
    config.set('cauldronRepositories', sortObjectByKeys(cauldronRepositories));
    if (activate) {
      this.activate({ alias });
    }
    return { alias, url };
  }

  public doesExist({ alias }: { alias: string }) {
    const cauldronRepositories = config.get('cauldronRepositories', {});
    return cauldronRepositories[alias] !== undefined;
  }

  public remove({ alias }: { alias: string }): CauldronRepository {
    this.throwIfAliasDoesNotExist({ alias });
    const cauldronRepositories = config.get('cauldronRepositories');
    const result = { alias, url: cauldronRepositories[alias] };
    delete cauldronRepositories[alias];
    config.set('cauldronRepositories', sortObjectByKeys(cauldronRepositories));
    const cauldronRepoInUse = config.get('cauldronRepoInUse');
    if (cauldronRepoInUse === alias) {
      config.set('cauldronRepoInUse', null);
    }
    return result;
  }

  public list(): CauldronRepository[] {
    const repositories = config.get('cauldronRepositories', {});
    return repositories
      ? Object.keys(repositories).map((alias) => ({
          alias,
          url: repositories[alias],
        }))
      : [];
  }

  public get current(): CauldronRepository | void {
    const alias = config.get('cauldronRepoInUse');
    if (alias) {
      const repositories = config.get('cauldronRepositories', {});
      const url = repositories[alias];
      if (url) {
        return {
          alias,
          url,
        };
      }
    }
  }

  public activate({ alias }: { alias: string }) {
    this.throwIfAliasDoesNotExist({ alias });
    this.updateCauldronRepoInUse({ alias });
  }
  public deactivate() {
    this.updateCauldronRepoInUse();
  }

  private updateCauldronRepoInUse({ alias }: { alias?: string } = {}) {
    config.set('cauldronRepoInUse', alias);
    shell.rm('-rf', Platform.cauldronDirectory);
  }

  private throwIfAliasExist({ alias }: { alias: string }) {
    if (this.doesExist({ alias })) {
      throw new Error(
        `A Cauldron repository already exists with ${alias} alias`,
      );
    }
  }

  private throwIfAliasDoesNotExist({ alias }: { alias: string }) {
    if (!this.doesExist({ alias })) {
      throw new Error(`Cauldron repository ${alias} does not exist`);
    }
  }
}

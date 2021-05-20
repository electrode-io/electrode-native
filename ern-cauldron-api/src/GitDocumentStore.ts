import BaseGit from './BaseGit';
import fs from 'fs-extra';
import path from 'path';
import { Cauldron, ICauldronDocumentStore } from './types';
import { schemaVersion } from './schemas';

const CAULDRON_FILENAME = 'cauldron.json';

export default class GitDocumentStore
  extends BaseGit
  implements ICauldronDocumentStore
{
  public readonly jsonPath: string;
  private cauldron: Cauldron;

  constructor({
    cauldronPath,
    repository,
    branch = 'master',
    cauldron = {
      name: 'Cauldron',
      nativeApps: [],
      schemaVersion,
    },
  }: {
    cauldronPath: string;
    repository?: string;
    branch: string;
    cauldron?: Cauldron;
  }) {
    super({ cauldronPath, repository, branch });
    this.jsonPath = path.resolve(this.fsPath, CAULDRON_FILENAME);
    this.cauldron = cauldron;
  }

  // ===========================================================
  // ICauldronDocumentAccess implementation
  // ===========================================================

  public async commit(message: string = 'Commit') {
    await fs.writeJson(this.jsonPath, this.cauldron, { spaces: 2 });
    await this.git.add(CAULDRON_FILENAME);
    if (!this.pendingTransaction) {
      await this.git.commit(message);
      await this.push();
    }
  }

  public async getCauldron(): Promise<Cauldron> {
    const hasSynced = await this.sync();
    if (hasSynced && (await fs.pathExists(this.jsonPath))) {
      this.cauldron = <Cauldron>await fs.readJson(this.jsonPath);
    }
    return this.cauldron;
  }
}

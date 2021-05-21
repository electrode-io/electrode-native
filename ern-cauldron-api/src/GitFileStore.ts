import BaseGit from './BaseGit';
import fs from 'fs-extra';
import path from 'path';
import { shell } from 'ern-core';
import { ICauldronFileStore } from './types';

export default class GitFileStore
  extends BaseGit
  implements ICauldronFileStore
{
  private readonly prefix: string;

  constructor({
    cauldronPath,
    repository,
    branch,
  }: {
    cauldronPath: string;
    repository?: string;
    branch: string;
  }) {
    super({ cauldronPath, repository, branch });
  }

  // ===========================================================
  // ICauldronFileAccess implementation
  // ===========================================================

  public async storeFile(
    filePath: string,
    content: string | Buffer,
    fileMode?: string,
  ) {
    await this.sync();
    const storeDirectoryPath = path.resolve(
      this.fsPath,
      path.dirname(filePath),
    );
    await fs.ensureDir(storeDirectoryPath);
    const pathToFile = path.resolve(
      storeDirectoryPath,
      path.basename(filePath),
    );
    await fs.writeFile(pathToFile, content, { flag: 'w' });
    if (fileMode) {
      shell.chmod(fileMode, pathToFile);
    }
    await this.git.add(pathToFile);
    if (!this.pendingTransaction) {
      await this.git.commit(`Add file ${filePath}`);
      await this.push();
    }
  }

  public async hasFile(filePath: string) {
    await this.sync();
    try {
      fs.statSync(this.pathToFile(filePath)).isFile();
      return true;
    } catch (e) {
      return false;
    }
  }

  public async getPathToFile(filePath: string): Promise<string | undefined> {
    await this.sync();
    if (await fs.pathExists(this.pathToFile(filePath))) {
      return this.pathToFile(filePath);
    }
  }

  public async getFile(filePath: string): Promise<Buffer | undefined> {
    await this.sync();
    if (await fs.pathExists(this.pathToFile(filePath))) {
      return fs.readFile(this.pathToFile(filePath));
    }
  }

  public async removeFile(filePath: string): Promise<boolean> {
    await this.sync();
    if (await fs.pathExists(this.pathToFile(filePath))) {
      await this.git.rm(this.pathToFile(filePath));
      if (!this.pendingTransaction) {
        await this.git.commit(`Remove file ${filePath}`);
        await this.push();
      }
      return true;
    }
    return false;
  }

  private pathToFile(filePath: string) {
    return path.join(this.fsPath, filePath);
  }
}

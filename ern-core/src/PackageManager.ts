import { NpmCli } from './NpmCli';
import { YarnCli } from './YarnCli';
import { PackagePath } from './PackagePath';

export type PackageManagerType = 'npm' | 'yarn';

export class PackageManager {
  public static npm() {
    return new PackageManager('npm');
  }

  public static yarn() {
    return new PackageManager('yarn');
  }

  private readonly yarnCli: YarnCli;
  private readonly npmCli: NpmCli;

  public constructor(readonly type: PackageManagerType) {
    this.yarnCli = new YarnCli();
    this.npmCli = new NpmCli();
  }

  public async add(
    dependencyPath: PackagePath,
    {
      dev,
      peer,
    }: {
      dev?: boolean;
      peer?: boolean;
    } = {},
  ) {
    return this.type === 'npm'
      ? this.npmCli.install({ dependencyPath, dev, peer })
      : this.yarnCli.add(dependencyPath, { dev, peer });
  }

  public async init() {
    return this.type === 'npm' ? this.npmCli.init() : this.yarnCli.init();
  }

  public async install() {
    return this.type === 'npm' ? this.npmCli.install() : this.yarnCli.install();
  }

  public async upgrade(dependencyPath: PackagePath) {
    return this.type === 'npm'
      ? this.npmCli.update(dependencyPath)
      : this.yarnCli.upgrade(dependencyPath);
  }
}

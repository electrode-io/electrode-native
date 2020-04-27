import { PackagePath } from './PackagePath';
import { execp } from './childProcess';
import log from './log';

export class NpmCli {
  public readonly binaryPath: string;

  constructor(binaryPath: string = 'npm') {
    this.binaryPath = binaryPath;
  }

  public async install({
    dependencyPath,
    dev,
    peer,
  }: {
    dependencyPath?: PackagePath;
    dev?: boolean;
    peer?: boolean;
  } = {}) {
    const cmd = dependencyPath
      ? `install ${dependencyPath!.toString()} ${
          dev ? '--save-dev' : '--save-exact'
        }`
      : 'install';
    return this.runNpmCommand(cmd);
  }

  public async update(dependencyPath: PackagePath) {
    const cmd = `update ${dependencyPath.toString()}`;
    return this.runNpmCommand(cmd);
  }

  public async init() {
    const cmd = `init --yes`;
    return this.runNpmCommand(cmd);
  }

  public async runNpmCommand(command: string): Promise<string | Buffer> {
    const cmd = `${this.binaryPath} ${command}`;
    log.debug(`[runNpmCommand] Running ${cmd}`);
    return execp(cmd);
  }
}

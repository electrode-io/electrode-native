import fs from 'fs-extra';
import path from 'path';
import shell from './shell';
import createTmpDir from './createTmpDir';
import { execp, spawnp } from './childProcess';
import { exec, spawn } from 'child_process';
import fetch from 'node-fetch';
import log from './log';
import kax from './kax';
import util from 'util';
import semver from 'semver';

const ex = util.promisify(exec);
const sp = util.promisify(spawn);

export interface BundlingResult {
  // The root path to the assets
  assetsPath: string;
  // The target platform of the bundle
  platform: string;
  // Indicates whether this is a dev bundle or a production one
  dev: boolean;
  // Full path to the bundle
  bundlePath: string;
  // Full path to the source map (if any)
  sourceMapPath?: string;
  // Is this an hermes bundle ?
  isHermesBundle?: boolean;
}

export default class ReactNativeCli {
  private readonly binaryPath: string;

  constructor(binaryPath: string = 'react-native') {
    this.binaryPath = binaryPath;
  }

  private async shouldUseCommunityCliForVersion(
    rnVersion: string,
  ): Promise<boolean> {
    return semver.gte(rnVersion.replace(/[\^~]/, ''), '0.77.0');
  }

  private async shouldUseCommunityCliForProject(
    cwd?: string,
  ): Promise<boolean> {
    if (!cwd) return false;

    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        const rnVersion =
          packageJson.dependencies?.['react-native'] || '0.60.0';
        return this.shouldUseCommunityCliForVersion(rnVersion);
      }
    } catch (e) {
      // If we can't determine version, use legacy approach
    }

    return false;
  }

  public async init(
    projectName: string,
    rnVersion: string,
    {
      skipInstall,
      template,
    }: {
      skipInstall?: boolean;
      template?: string;
    } = {},
  ) {
    const dir = path.join(process.cwd(), projectName);

    if (await fs.pathExists(dir)) {
      throw new Error(`Path already exists will not override ${dir}`);
    }

    const options = [];
    options.push(`--version ${rnVersion}`);
    if (skipInstall) {
      options.push('--skip-install');
    }
    if (template) {
      options.push(`--template ${template}`);
    }
    const initCmd = `init ${projectName} ${options.join(' ')}`;

    if (semver.gte(rnVersion, '0.81.0')) {
      return execp(`npx @react-native-community/cli@15.1.3 ${initCmd}`);
    } else if (semver.gte(rnVersion, '0.77.0')) {
      return execp(`npx @react-native-community/cli@15.0.1 ${initCmd}`);
    } else if (semver.gte(rnVersion, '0.60.0')) {
      return execp(
        `npx --ignore-existing react-native@${rnVersion} ${initCmd}`,
      );
    } else {
      return execp(`${this.binaryPath} ${initCmd}`);
    }
  }

  public async bundle({
    entryFile,
    dev,
    bundleOutput,
    assetsDest,
    platform,
    workingDir,
    sourceMapOutput,
    resetCache,
  }: {
    entryFile: string;
    dev: boolean;
    bundleOutput: string;
    assetsDest: string;
    platform: string;
    workingDir?: string;
    sourceMapOutput?: string;
    resetCache?: boolean;
  }): Promise<BundlingResult> {
    // For React Native 0.77.0+ use @react-native-community/cli
    const shouldUseCommunityCliForProject =
      await this.shouldUseCommunityCliForProject(workingDir);

    const bundleArgs = `\
${entryFile ? `--entry-file=${entryFile}` : ''} \
${dev ? '--dev=true' : '--dev=false'} \
${platform ? `--platform=${platform}` : ''} \
${bundleOutput ? `--bundle-output=${bundleOutput}` : ''} \
${assetsDest ? `--assets-dest=${assetsDest}` : ''} \
${sourceMapOutput ? `--sourcemap-output=${sourceMapOutput}` : ''} \
${resetCache ? '--reset-cache' : ''}`;

    let bundleCommand: string;
    const execOptions: any = { cwd: workingDir };
    if (shouldUseCommunityCliForProject) {
      // RN >= 0.77: Use npx @react-native-community/cli (ships metro plugin via RN itself)
      bundleCommand = `npx @react-native-community/cli bundle ${bundleArgs}`;
    } else {
      // RN < 0.77: Use the project-local react-native CLI from node_modules
      // The composite project's react-native dependency ships its own CLI version
      // that includes the bundle command (via cli-plugin-metro)
      const localCliBin = workingDir
        ? path.join(workingDir, 'node_modules', '.bin', 'react-native')
        : 'react-native';
      bundleCommand = `${localCliBin} bundle ${bundleArgs}`;
      // Older Metro versions use md4 hash which is unsupported in Node 17+ (OpenSSL 3)
      execOptions.env = {
        ...process.env,
        NODE_OPTIONS: '--openssl-legacy-provider',
      };
    }

    await execp(bundleCommand, execOptions);
    if (!(await fs.pathExists(bundleOutput))) {
      // Under some circumstances, Metro bundler process might fail
      // with some logs, but exit the process with a non error status code.
      // This guard is to make sure that the bundle was generated,
      // independently of the exit status code returned by Metro process.
      throw new Error(
        'Metro failed to generate the JS bundle. Check Metro logs for more details.',
      );
    }

    return {
      assetsPath: assetsDest,
      bundlePath: bundleOutput,
      dev,
      platform,
      sourceMapPath: sourceMapOutput,
    };
  }

  public startPackager({
    cwd = process.cwd(),
    host = 'localhost',
    port = '8081',
    resetCache = true,
  }: {
    cwd?: string;
    host?: string;
    port?: string;
    resetCache?: boolean;
  } = {}) {
    const args: string[] = [];
    if (host) {
      args.push('--host', host);
    }
    if (port) {
      args.push('--port', port);
    }
    if (resetCache!!) {
      args.push(`--reset-cache`);
    }

    // Check if we should use @react-native-community/cli for RN 0.77+
    let shouldUseCommunityCliCommand = false;
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = fs.readJSONSync(packageJsonPath);
        const rnVersion =
          packageJson.dependencies?.['react-native'] || '0.60.0';
        shouldUseCommunityCliCommand = semver.gte(
          rnVersion.replace(/[\^~]/, ''),
          '0.77.0',
        );
      }
    } catch (e) {
      // If we can't determine version, use legacy approach
    }

    if (shouldUseCommunityCliCommand) {
      spawn('npx', ['@react-native-community/cli', 'start', ...args], {
        cwd,
        stdio: 'inherit',
      });
    } else {
      // RN < 0.77: Use the project-local react-native CLI from node_modules
      // The project's react-native dependency ships its own CLI version
      // that includes the start command (via cli-plugin-metro)
      const localCliBin = path.join(
        cwd,
        'node_modules',
        '.bin',
        'react-native',
      );
      spawn(localCliBin, ['start', ...args], {
        cwd,
        stdio: 'inherit',
      });
    }
  }

  public async startPackagerInNewWindow({
    cwd = process.cwd(),
    host = 'localhost',
    port = '8081',
    resetCache = true,
    provideModuleNodeModules,
  }: {
    cwd?: string;
    host?: string;
    port?: string;
    resetCache?: boolean;
    provideModuleNodeModules?: string[];
  } = {}) {
    const args: string[] = [];
    if (host) {
      args.push(`--host ${host}`);
    }
    if (port) {
      args.push(`--port ${port}`);
    }
    if (resetCache!!) {
      args.push(`--reset-cache`);
    }
    if (provideModuleNodeModules) {
      args.push(
        `--providesModuleNodeModules ${provideModuleNodeModules.join(',')}`,
      );
    }

    const isPackagerRunning = await this.isPackagerRunning(host, port);

    if (!isPackagerRunning) {
      await kax
        .task(`Starting React Native Packager [http://${host}:${port}]`)
        .run(Promise.resolve());
      if (process.platform === 'darwin') {
        return this.darwinStartPackagerInNewWindow({ cwd, args });
      } else if (/^win/.test(process.platform)) {
        return this.windowsStartPackagerInNewWindow({ cwd, args });
      } else {
        return this.linuxStartPackageInNewWindow({ cwd, args });
      }
    } else {
      log.warn(
        'A React Native Packager is already running in a different process',
      );
    }
  }

  public async darwinStartPackagerInNewWindow({
    cwd = process.cwd(),
    args = [],
  }: {
    cwd?: string;
    args?: string[];
  }) {
    const scriptPath = await this.createStartPackagerScript({
      args,
      cwd,
      scriptFileName: 'packager.sh',
    });
    spawnp('open', ['-a', 'Terminal', scriptPath]);
  }

  public async linuxStartPackageInNewWindow({
    cwd = process.cwd(),
    args = [],
  }: {
    cwd?: string;
    args?: string[];
  }) {
    const scriptPath = await this.createStartPackagerScript({
      args,
      cwd,
      scriptFileName: 'packager.sh',
    });
    spawnp('gnome-terminal', ['--command', scriptPath]);
  }

  public async windowsStartPackagerInNewWindow({
    cwd = process.cwd(),
    args = [],
  }: {
    cwd?: string;
    args?: string[];
  }) {
    const scriptPath = await this.createStartPackagerScript({
      args,
      cwd,
      scriptFileName: 'packager.bat',
    });
    spawnp('cmd.exe', ['/C', scriptPath], { detached: true });
  }

  public async createStartPackagerScript({
    cwd,
    args,
    scriptFileName,
  }: {
    cwd: string;
    args: string[];
    scriptFileName: string;
  }): Promise<string> {
    const tmpDir = createTmpDir();
    const tmpScriptPath = path.join(tmpDir, scriptFileName);

    // Determine which CLI to use based on RN version
    let command: string;
    let useCommunityCliLatest = false;
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath);
        const rnVersion =
          packageJson.dependencies?.['react-native'] || '0.60.0';
        useCommunityCliLatest = semver.gte(
          rnVersion.replace(/[\^~]/, ''),
          '0.77.0',
        );
      }
    } catch (e) {
      // If we can't determine version, use legacy approach
    }

    if (useCommunityCliLatest) {
      command = `npx @react-native-community/cli start ${args.join(' ')}`;
    } else {
      // RN < 0.77: Use the project-local react-native CLI from node_modules
      const localCliBin = path.join(
        cwd,
        'node_modules',
        '.bin',
        'react-native',
      );
      command = `${localCliBin} start ${args.join(' ')}`;
    }

    await fs.writeFile(
      tmpScriptPath,
      `
cd ${cwd}
echo "Running ${command}"
${command}
`,
    );
    shell.chmod('+x', tmpScriptPath);
    return tmpScriptPath;
  }

  public async isPackagerRunning(host: string, port: string) {
    return fetch(`http://${host}:${port}/status`).then(
      (res) => res.text().then((body) => body === 'packager-status:running'),
      () => false,
    );
  }
}

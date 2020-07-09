import createTmpDir from './createTmpDir';
import shell from './shell';
import { yarn } from './clients';
import { PackagePath } from './PackagePath';
import { spawnp } from './childProcess';
import path from 'path';
import fs from 'fs-extra';
import semver from 'semver';

export class HermesCli {
  public static async fromVersion(version: string): Promise<HermesCli> {
    this.workingDir = createTmpDir();
    shell.pushd(this.workingDir);
    try {
      await yarn.init();
      await yarn.add(PackagePath.fromString(`hermes-engine@${version}`));
      return new HermesCli(
        path.join(this.workingDir, HermesCli.hermesModulePath),
      );
    } finally {
      shell.popd();
    }
  }

  private static workingDir: string;

  public static get hermesVersion(): string {
    const pJson = fs.readJSONSync(
      path.join(this.workingDir, 'node_modules/hermes-engine/package.json'),
    );
    return pJson.version;
  }

  public static get hermesBinaryName(): string {
    return semver.lt(this.hermesVersion, '0.5.0') ? 'hermes' : 'hermesc';
  }

  public static get hermesModulePath(): string {
    return path.normalize(
      `node_modules/hermes-engine/${HermesCli.platformDirectory}/${this.hermesBinaryName}`,
    );
  }

  public static get platformDirectory(): string {
    return process.platform === 'darwin'
      ? 'osx-bin'
      : /^win/.test(process.platform)
      ? 'win64-bin'
      : 'linux64-bin';
  }

  constructor(private readonly hermesPath: string) {}

  public async compileDebugBundle({
    jsBundlePath,
    outputBundlePath,
  }: {
    jsBundlePath: string;
    outputBundlePath?: string;
  }): Promise<{
    hermesBundlePath: string;
  }> {
    const hermesBundlePath = outputBundlePath || jsBundlePath;
    await this.run({
      args: ['-emit-binary', '-out', hermesBundlePath, jsBundlePath],
    });
    return {
      hermesBundlePath,
    };
  }

  public async compileReleaseBundle({
    bundleSourceMapPath,
    compositePath,
    jsBundlePath,
    outputBundlePath,
  }: {
    bundleSourceMapPath?: string;
    compositePath: string;
    jsBundlePath: string;
    outputBundlePath?: string;
  }): Promise<{
    compilerSourceMapPath?: string;
    hermesBundlePath: string;
    packagerSourceMapPath?: string;
  }> {
    const hermesBundlePath = outputBundlePath || jsBundlePath;
    const hermesSourceMapPath = `${hermesBundlePath}.map`;
    const packagerSourceMapPath =
      bundleSourceMapPath &&
      path.join(
        path.dirname(bundleSourceMapPath),
        'index.android.packager.map',
      );

    if (bundleSourceMapPath) {
      // Rename the existing JS bundle sourcemap as index.android.packager.map
      shell.mv(bundleSourceMapPath, packagerSourceMapPath!);
    }

    await this.run({
      args: [
        '-emit-binary',
        '-out',
        hermesBundlePath,
        jsBundlePath,
        '-O',
        '-output-source-map',
      ],
    });

    // Hermes CLI does not give control over the
    // location of generated source map. It just generates it in
    // the same directory as the hermes bundle, with the same name
    // as the bundle, with a new .map extension (index.android.map)
    // Move it to same location as the JS bundle one, but rename it
    // to index.android.compiler.map
    const compilerSourceMapPath = path.join(
      path.dirname(bundleSourceMapPath || hermesBundlePath),
      'index.android.compiler.map',
    );
    shell.mv(hermesSourceMapPath, compilerSourceMapPath);

    // Delete the compiler source map if its not needed
    // Note that it's not possible to not generate it in the first place
    // (i.e remove the --output-source-map option from command above)
    // as it would still generate the source map but inlined in the
    // hermes bundle making its size much bigger
    if (!bundleSourceMapPath) {
      shell.rm(compilerSourceMapPath);
    }

    if (bundleSourceMapPath) {
      // Compose both source maps to get final one, and write it to sourcemap path
      const pathToComposeScript = path.join(
        compositePath,
        'node_modules/react-native/scripts/compose-source-maps.js',
      );
      shell.exec(
        `node ${pathToComposeScript} ${packagerSourceMapPath} ${compilerSourceMapPath} -o ${bundleSourceMapPath}`,
      );
    }

    return {
      compilerSourceMapPath: bundleSourceMapPath
        ? compilerSourceMapPath
        : undefined,
      hermesBundlePath,
      packagerSourceMapPath,
    };
  }

  public async run({ args }: { args: string[] }) {
    return spawnp(this.hermesPath, args);
  }
}

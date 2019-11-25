import createTmpDir from './createTmpDir'
import shell from './shell'
import { yarn } from './clients'
import { PackagePath } from './PackagePath'
import { spawnp } from './childProcess'
import path from 'path'

export class HermesCli {
  public static async fromVersion(version: string): Promise<HermesCli> {
    const workingDir = createTmpDir()
    shell.pushd(workingDir)
    try {
      await yarn.init()
      await yarn.add(PackagePath.fromString(`hermes-engine@${version}`))
      return new HermesCli(path.join(workingDir, HermesCli.hermesModulePath))
    } finally {
      shell.popd()
    }
  }

  public static get hermesModulePath(): string {
    return path.normalize(
      `node_modules/hermes-engine/${HermesCli.platformDirectory}/hermes`
    )
  }

  public static get platformDirectory(): string {
    return process.platform === 'darwin'
      ? 'osx-bin'
      : /^win/.test(process.platform)
      ? 'win64-bin'
      : 'linux64-bin'
  }

  constructor(private readonly hermesPath: string) {}

  public async compileDebugBundle({
    jsBundlePath,
    outputBundlePath,
  }: {
    jsBundlePath: string
    outputBundlePath?: string
  }): Promise<{
    hermesBundlePath: string
  }> {
    const hermesBundlePath = outputBundlePath || jsBundlePath
    await this.run({
      args: ['-emit-binary', '-out', hermesBundlePath, jsBundlePath],
    })
    return {
      hermesBundlePath,
    }
  }
  public async compileReleaseBundle({
    jsBundlePath,
    outputBundlePath,
  }: {
    jsBundlePath: string
    outputBundlePath?: string
  }): Promise<{
    hermesBundlePath: string
    hermesSourceMapPath: string
  }> {
    const hermesBundlePath = outputBundlePath || jsBundlePath
    await this.run({
      args: [
        '-emit-binary',
        '-out',
        hermesBundlePath,
        jsBundlePath,
        '-O',
        '-output-source-map',
      ],
    })
    return {
      hermesBundlePath,
      hermesSourceMapPath: `${hermesBundlePath}.map`,
    }
  }

  public async run({ args }: { args: string[] }) {
    return spawnp(this.hermesPath, args)
  }
}

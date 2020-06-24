import path from 'path';
import readDir from 'fs-readdir-recursive';

export class IosPluginConfigGenerator {
  public static fromPath(p: string) {
    return new IosPluginConfigGenerator(p);
  }

  public readonly root: string;
  public readonly files: string[];

  private readonly excludedDirectoriesRe = new RegExp(/sample|demo|example/i);

  private constructor(p: string) {
    this.root = p;
    this.files = readDir(p, (x) => !this.excludedDirectoriesRe.test(x));
  }

  public async generateConfig({
    resolvePbxProjPath,
  }: {
    resolvePbxProjPath: (pbxProjPaths: string[]) => Promise<string>;
  }): Promise<any> {
    if (!this.doesPluginSupportIos) {
      throw new Error('No iOS project found');
    }
    const config: any = {};
    const pbxProjPath: string =
      this.pbxprojPaths.length > 1
        ? await resolvePbxProjPath(this.pbxprojPaths)
        : this.pbxprojPaths[0];
    const projName = this.getProjectName(pbxProjPath);
    const xcodeprojPath = path.dirname(pbxProjPath);
    const rootXcodeProjPath = path.dirname(xcodeprojPath);
    config.copy = [
      {
        dest: `{{{projectName}}}/Libraries/${projName}`,
        source: `${rootXcodeProjPath}/*`,
      },
    ];

    config.pbxproj = {
      addHeaderSearchPath: [
        `\"$(SRCROOT)/{{{projectName}}}/Libraries/${projName}/**\"`,
      ],
      addProject: [
        {
          group: 'Libraries',
          path: `${projName}/${projName}.xcodeproj`,
          staticLibs: [
            {
              name: `lib${projName}.a`,
              target: projName,
            },
          ],
        },
      ],
    };
    return config;
  }

  public get doesPluginSupportIos() {
    return this.pbxprojPaths.length > 0;
  }

  public getProjectName(pbxProjPath: string) {
    let match = pbxProjPath.match(/.+\/(.+)\.xcodeproj/);
    if (!match) {
      match = pbxProjPath.match(/^(.+)\.xcodeproj/);
    }
    return match![1];
  }

  get pbxprojPaths(): string[] {
    return this.files.filter((x) => x.endsWith('.pbxproj'));
  }
}

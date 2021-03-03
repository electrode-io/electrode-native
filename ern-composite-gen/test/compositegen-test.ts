import { assert, expect } from 'chai';
import { doesThrow } from 'ern-util-dev';
import sinon from 'sinon';
import path from 'path';
import fs from 'fs-extra';
import { applyYarnResolutions } from '../src/applyYarnResolutions';
import { generateComposite } from '../src/generateComposite';
import {
  getMiniAppsDeltas,
  getPackageJsonDependenciesUsingMiniAppDeltas,
  runYarnUsingMiniAppDeltas,
} from '../src/miniAppsDeltasUtils';
import * as ernUtil from 'ern-core';
import { PackagePath } from 'ern-core';

const { YarnCli, shell } = ernUtil;
const sandbox = sinon.createSandbox();

// Spies
let yarnCliStub: any;

let tmpOutDir: string;
const currentDir = __dirname;
const pathToFixtures = path.join(currentDir, 'fixtures');
const pathToSampleYarnLock = path.join(pathToFixtures, 'sample.yarn.lock');
const sampleYarnLock = fs.readFileSync(pathToSampleYarnLock, 'utf8');

describe('ern-container-gen utils.js', () => {
  // Before each test
  beforeEach(() => {
    yarnCliStub = sandbox.stub(YarnCli.prototype);

    // Go back to initial dir (otherwise we might start execution from a temporary
    // created directory that got removed and it makes shelljs go crazy)
    process.chdir(currentDir);

    // Create temporary directory to use as target output directory of some
    // functions under test
    tmpOutDir = ernUtil.createTmpDir();
  });

  // After each test
  afterEach(() => {
    // Remove the temporary output directory created for the test
    shell.rm('-rf', tmpOutDir);
    sandbox.restore();
  });

  // ==========================================================
  // getMiniAppsDeltas
  // ==========================================================
  describe('getMiniAppsDeltas', () => {
    it('should compute new deltas', () => {
      const miniApps = [
        PackagePath.fromString('fourth-miniapp@1.0.0'),
        PackagePath.fromString('fifth-miniapp@1.0.0'),
      ];
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock);
      expect(result).to.have.property('new').that.is.a('array').lengthOf(2);
    });

    it('should compute same deltas', () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@6.0.0'),
        PackagePath.fromString('second-miniapp@3.0.0'),
      ];
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock);
      expect(result).to.have.property('same').that.is.a('array').lengthOf(2);
    });

    it('should compute upgraded deltas', () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@7.0.0'),
        PackagePath.fromString('second-miniapp@4.0.0'),
      ];
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock);
      expect(result)
        .to.have.property('upgraded')
        .that.is.a('array')
        .lengthOf(2);
    });

    it('should compute deltas', () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@1.0.0'),
        PackagePath.fromString('second-miniapp@3.0.0'),
        PackagePath.fromString('fourth-miniapp@1.0.0'),
      ];
      const result = getMiniAppsDeltas(miniApps, sampleYarnLock);
      expect(result).to.have.property('new').that.is.a('array').lengthOf(1);
      expect(result).to.have.property('same').that.is.a('array').lengthOf(1);
      expect(result)
        .to.have.property('upgraded')
        .that.is.a('array')
        .lengthOf(1);
    });
  });

  // ==========================================================
  // runYarnUsingMiniAppDeltas
  // ==========================================================
  describe('runYarnUsingMiniAppDeltas', () => {
    it('should yarn add new MiniApps', async () => {
      const miniAppsDeltas = {
        new: [
          PackagePath.fromString('fourth-miniapp@7.0.0'),
          PackagePath.fromString('fifth-miniapp@4.0.0'),
        ],
      };
      await runYarnUsingMiniAppDeltas(miniAppsDeltas);
      assert(yarnCliStub.add.calledTwice);
    });

    it('should yarn add upgraded MiniApps', async () => {
      const miniAppsDeltas = {
        upgraded: [
          PackagePath.fromString('first-miniapp@7.0.0'),
          PackagePath.fromString('second-miniapp@4.0.0'),
        ],
      };
      await runYarnUsingMiniAppDeltas(miniAppsDeltas);
      assert(yarnCliStub.add.calledTwice);
    });

    it('should not yarn add same MiniApps versions', async () => {
      const miniAppsDeltas = {
        same: [
          PackagePath.fromString('first-miniapp@6.0.0'),
          PackagePath.fromString('second-miniapp@3.0.0'),
        ],
      };
      await runYarnUsingMiniAppDeltas(miniAppsDeltas);
      assert(yarnCliStub.add.notCalled);
    });

    it('should work correctly with mixed deltas', async () => {
      const miniAppsDeltas = {
        new: [PackagePath.fromString('fourth-miniapp@7.0.0')],
        same: [
          PackagePath.fromString('first-miniapp@6.0.0'),
          PackagePath.fromString('second-miniapp@3.0.0'),
        ],
        upgraded: [
          PackagePath.fromString('first-miniapp@7.0.0'),
          PackagePath.fromString('second-miniapp@4.0.0'),
        ],
      };
      await runYarnUsingMiniAppDeltas(miniAppsDeltas);
      assert(yarnCliStub.add.calledThrice);
    });
  });

  // ==========================================================
  // getPackageJsonDependenciesBasedOnMiniAppDeltas
  // ==========================================================
  describe('getPackageJsonDependenciesBasedOnMiniAppDeltas', () => {
    it('should inject MiniApps that have same version as previous', () => {
      const miniAppsDeltas = {
        same: [
          PackagePath.fromString('first-miniapp@6.0.0'),
          PackagePath.fromString('second-miniapp@3.0.0'),
        ],
      };
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(
        miniAppsDeltas,
        sampleYarnLock,
      );
      expect(result).to.have.property('first-miniapp', '6.0.0');
      expect(result).to.have.property('second-miniapp', '3.0.0');
    });

    it('should inject MiniApps that have upgraded versions', () => {
      const miniAppsDeltas = {
        upgraded: [
          PackagePath.fromString('first-miniapp@7.0.0'),
          PackagePath.fromString('second-miniapp@4.0.0'),
        ],
      };
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(
        miniAppsDeltas,
        sampleYarnLock,
      );
      expect(result).to.have.property('first-miniapp', '6.0.0');
      expect(result).to.have.property('second-miniapp', '3.0.0');
    });

    it('should not inject MiniApps that are new', () => {
      const miniAppsDeltas = {
        new: [
          PackagePath.fromString('fourth-miniapp@7.0.0'),
          PackagePath.fromString('fifth-miniapp@4.0.0'),
        ],
      };
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(
        miniAppsDeltas,
        sampleYarnLock,
      );
      expect(result).empty;
    });

    it('should inject proper MiniApps', () => {
      const miniAppsDeltas = {
        new: [PackagePath.fromString('fourth-miniapp@7.0.0')],
        same: [PackagePath.fromString('first-miniapp@6.0.0')],
        upgraded: [PackagePath.fromString('second-miniapp@4.0.0')],
      };
      const result = getPackageJsonDependenciesUsingMiniAppDeltas(
        miniAppsDeltas,
        sampleYarnLock,
      );
      expect(result).to.have.property('first-miniapp', '6.0.0');
      expect(result).to.have.property('second-miniapp', '3.0.0');
    });
  });

  const createCompositeNodeModulesReactNativePackageJson = (
    rootDir: string,
    rnVersion: string,
  ) => {
    const pathToCompositeNodeModulesReactNative = path.join(
      rootDir,
      'node_modules',
      'react-native',
    );
    const pathToCompositeNodeModulesMetro = path.join(
      rootDir,
      'node_modules',
      'metro',
    );
    ernUtil.shell.mkdir('-p', pathToCompositeNodeModulesReactNative);
    fs.writeFileSync(
      path.join(pathToCompositeNodeModulesReactNative, 'package.json'),
      JSON.stringify({ version: rnVersion }),
    );
    ernUtil.shell.mkdir('-p', pathToCompositeNodeModulesMetro);
    fs.writeFileSync(
      path.join(pathToCompositeNodeModulesMetro, 'package.json'),
      JSON.stringify({ version: '0.51.0' }),
    );
  };

  // ==========================================================
  // generateComposite [with yarn lock]
  // ==========================================================
  describe('generateComposite [with yarn lock]', () => {
    it('should throw an exception if at least one of the MiniApp path is using a file scheme [1]', async () => {
      const miniApps = [
        PackagePath.fromString(path.join(__dirname, 'fixtures', 'miniapp')),
      ];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: 'hello',
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if at least one of the MiniApp path is using a file scheme [2]', async () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@1.0.0'),
        PackagePath.fromString(path.join(__dirname, 'fixtures', 'miniapp')),
      ];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: 'hello',
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if at least one of the MiniApp path is using a git scheme [1]', async () => {
      const miniApps = [PackagePath.fromString('git://github.com:org/repo')];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: 'hello',
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if at least one of the MiniApp path is using a git scheme [2]', async () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@1.0.0'),
        PackagePath.fromString('git://github.com:org/repo'),
      ];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: 'hello',
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if one of the MiniApp is not using an explicit version [1]', async () => {
      const miniApps = [PackagePath.fromString('first-miniapp')];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: 'hello',
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if one of the MiniApp is not using an explicit version [1]', async () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp'),
        PackagePath.fromString('second-miniapp@1.0.0'),
      ];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: 'hello',
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if path to yarn.lock does not exists', async () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@1.0.0'),
        PackagePath.fromString('second-miniapp@1.0.0'),
      ];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: path.join(tmpOutDir, 'yarn.lock'),
        }),
        'No exception was thrown !',
      );
    });

    it('should throw an exception if called with no miniapp or js api impl', async () => {
      yarnCliStub.install.callsFake(() =>
        createCompositeNodeModulesReactNativePackageJson(tmpOutDir, '0.56.0'),
      );
      const miniApps: PackagePath[] = [];
      assert(
        await doesThrow(generateComposite, null, {
          miniApps,
          outDir: tmpOutDir,
          pathToYarnLock: pathToSampleYarnLock,
        }),
      );
    });

    it('should call yarn install prior to calling yarn add for each MiniApp', async () => {
      // One new, one same, one upgrade
      yarnCliStub.install.callsFake(() =>
        createCompositeNodeModulesReactNativePackageJson(tmpOutDir, '0.56.0'),
      );
      const miniApps = [
        PackagePath.fromString('first-miniapp@6.0.0'), // same
        PackagePath.fromString('second-miniapp@4.0.0'), // upgraded
        PackagePath.fromString('fourth-miniapp@1.0.0'), // new
      ];
      await generateComposite({
        miniApps,
        outDir: tmpOutDir,
        pathToYarnLock: pathToSampleYarnLock,
      });
      assert(yarnCliStub.install.calledOnce);
      sinon.assert.callCount(yarnCliStub.add, 4);
      assert(yarnCliStub.install.calledBefore(yarnCliStub.add));
    });

    it('should create index.js', async () => {
      // One new, one same, one upgrade
      yarnCliStub.install.callsFake(() =>
        createCompositeNodeModulesReactNativePackageJson(tmpOutDir, '0.56.0'),
      );
      const miniApps = [PackagePath.fromString('first-miniapp@6.0.0')];
      await generateComposite({
        miniApps,
        outDir: tmpOutDir,
        pathToYarnLock: pathToSampleYarnLock,
      });
      assert(fs.existsSync(path.join(tmpOutDir, 'index.js')));
    });
  });

  // ==========================================================
  // generateComposite [without yarn lock]
  // ==========================================================
  const fakeYarnInit = (rootDir: string, rnVersion: string) => {
    fs.writeFileSync(
      path.join(tmpOutDir, 'package.json'),
      JSON.stringify({ dependencies: {} }),
    );
    createCompositeNodeModulesReactNativePackageJson(rootDir, rnVersion);
  };

  describe('generateComposite [without yarn lock]', () => {
    // For the following tests, because in the case of no yarn lock provided
    // the package.json is created when running first yarn add, and we are using
    // a yarnAdd stub that is not going to run real yarn add, we need to create the
    // expected package.json beforehand
    it('should call yarn add for each MiniApp', async () => {
      const miniApps = [
        PackagePath.fromString('first-miniapp@6.0.0'), // same
        PackagePath.fromString('second-miniapp@4.0.0'), // upgraded
        PackagePath.fromString('fourth-miniapp@1.0.0'), // new
      ];
      yarnCliStub.init.callsFake(() => fakeYarnInit(tmpOutDir, '0.57.0'));
      await generateComposite({ miniApps, outDir: tmpOutDir });
      sinon.assert.callCount(yarnCliStub.add, 5);
    });

    it('should create index.js', async () => {
      // One new, one same, one upgrade
      const miniApps = [PackagePath.fromString('first-miniapp@6.0.0')];
      yarnCliStub.init.callsFake(() => fakeYarnInit(tmpOutDir, '0.57.0'));
      await generateComposite({ miniApps, outDir: tmpOutDir });
      assert(fs.existsSync(path.join(tmpOutDir, 'index.js')));
    });

    it('should create .babelrc with react-native preset for RN < 0.57.0', async () => {
      // One new, one same, one upgrade
      const miniApps = [PackagePath.fromString('first-miniapp@6.0.0')];
      yarnCliStub.init.callsFake(() => fakeYarnInit(tmpOutDir, '0.56.0'));
      await generateComposite({ miniApps, outDir: tmpOutDir });
      assert(fs.existsSync(path.join(tmpOutDir, '.babelrc')));
      const babelRc: any = JSON.parse(
        fs.readFileSync(path.join(tmpOutDir, '.babelrc')).toString(),
      );
      assert(babelRc.presets.includes('react-native'));
    });

    it('should create .babelrc with module:metro-react-native-babel-preset preset for RN >= 0.57.0', async () => {
      // One new, one same, one upgrade
      const miniApps = [PackagePath.fromString('first-miniapp@6.0.0')];
      yarnCliStub.init.callsFake(() => fakeYarnInit(tmpOutDir, '0.57.0'));
      await generateComposite({ miniApps, outDir: tmpOutDir });
      assert(fs.existsSync(path.join(tmpOutDir, '.babelrc')));
      const babelRc: any = JSON.parse(
        fs.readFileSync(path.join(tmpOutDir, '.babelrc')).toString(),
      );
      assert(
        babelRc.presets.includes('module:metro-react-native-babel-preset'),
      );
    });
  });

  // ==========================================================
  // applyYarnResolutions
  // ==========================================================
  describe('applyYarnResolutions', () => {
    it('should add resolutions field to the package.json', async () => {
      const packageJsonPath = path.join(tmpOutDir, 'package.json');
      fs.writeFileSync(packageJsonPath, '{}');
      const resolutions = {
        'c/**/left-pad': '1.1.2',
        'd2/left-pad': '1.1.1',
      };
      await applyYarnResolutions({ cwd: tmpOutDir, resolutions });
      const packageJson: any = JSON.parse(
        fs.readFileSync(packageJsonPath).toString(),
      );
      expect(packageJson.resolutions).to.be.an('object');
    });

    it('should add correct resolutions to the package.json', async () => {
      const packageJsonPath = path.join(tmpOutDir, 'package.json');
      fs.writeFileSync(packageJsonPath, '{}');
      const resolutions = {
        'c/**/left-pad': '1.1.2',
        'd2/left-pad': '1.1.1',
      };
      await applyYarnResolutions({ cwd: tmpOutDir, resolutions });
      const packageJson: any = JSON.parse(
        fs.readFileSync(packageJsonPath).toString(),
      );
      expect(packageJson.resolutions).deep.equal(resolutions);
    });

    it('should call yarn install', async () => {
      const packageJsonPath = path.join(tmpOutDir, 'package.json');
      fs.writeFileSync(packageJsonPath, '{}');
      const resolutions = {
        'c/**/left-pad': '1.1.2',
        'd2/left-pad': '1.1.1',
      };
      await applyYarnResolutions({ cwd: tmpOutDir, resolutions });
      assert(yarnCliStub.install.calledOnce);
    });
  });

  // ==========================================================
  // generateComposite [with custom extraNodeModules]
  // ==========================================================
  describe('generateComposite [with custom extraNodeModules]', () => {
    it('should create custom extraNodeModules in Metro config', async () => {
      yarnCliStub.init.callsFake(() => fakeYarnInit(tmpOutDir, '0.57.0'));
      await generateComposite({
        metroExtraNodeModules: {
          'pkg-a': '@scope/new-pkg-a',
          'pkg-b': path.join('/absolute/path/to/new-pkg-b'),
        },
        miniApps: [PackagePath.fromString('test-miniapp@1.0.0')],
        outDir: tmpOutDir,
      });
      fs.mkdirpSync(
        path.join(tmpOutDir, 'node_modules/metro-config/src/defaults'),
      );
      fs.mkdirpSync(
        path.join(tmpOutDir, 'node_modules/react-native-svg-transformer'),
      );
      fs.writeFileSync(
        path.join(
          tmpOutDir,
          'node_modules/metro-config/src/defaults/blacklist',
        ),
        'module.exports = () => {};\n',
      );
      fs.writeFileSync(
        path.join(
          tmpOutDir,
          'node_modules/react-native-svg-transformer/index.js',
        ),
        '',
      );

      assert(fs.existsSync(path.join(tmpOutDir, 'metro.config.js')));
      const metroConfig = require(path.join(tmpOutDir, 'metro.config.js'));
      expect(metroConfig.resolver).to.be.an('object');
      expect(metroConfig.resolver.extraNodeModules).to.be.an('object');
      expect(metroConfig.resolver.extraNodeModules)
        .to.have.property('pkg-a')
        .which.equals(path.join(tmpOutDir, 'node_modules', '@scope/new-pkg-a'));
      expect(metroConfig.resolver.extraNodeModules)
        .to.have.property('pkg-b')
        .which.equals(path.join('/absolute/path/to/new-pkg-b'));
    });
  });
});

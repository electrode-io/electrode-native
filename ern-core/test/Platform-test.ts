import Platform from '../src/Platform';
import config from '../src/config';
import createTmpDir from '../src/createTmpDir';
import shell from '../src/shell';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import childProcess from 'child_process';

import sinon from 'sinon';

const sandbox = sinon.createSandbox();

describe('Platform', () => {
  let ernHomePath: string;
  const processEnvErnHomeBackup = process.env.ern_home;
  const platformVersions = '["1.0.0", "2.0.0", "3.0.0", "1.0.1"]';
  let execSyncStub: any;
  let isYarnInstalledReturn = true;
  let throwOnExecSync = false;

  beforeEach(() => {
    ernHomePath = path.join(createTmpDir(), 'ern_home');
    process.env.ERN_HOME = ernHomePath;
    execSyncStub = sandbox.stub(childProcess, 'execSync').callsFake((cmd) => {
      if (throwOnExecSync) {
        throw new Error();
      }
      if (cmd === 'npm info ern-local-cli versions --json') {
        return Buffer.from(platformVersions);
      } else if (cmd.startsWith('yarn --version')) {
        if (isYarnInstalledReturn) {
          return Buffer.from('1.16.0');
        } else {
          throw new Error();
        }
      } else {
        return Buffer.from('unsupported test command');
      }
    });
  });

  afterEach(() => {
    processEnvErnHomeBackup === undefined
      ? delete process.env.ERN_HOME
      : (process.env.ERN_HOME = processEnvErnHomeBackup);
    sandbox.restore();
    isYarnInstalledReturn = true;
    throwOnExecSync = false;
  });

  describe('rootDirectory', () => {
    it('should return the process.env.ERN_HOME path if it is set', () => {
      expect(Platform.rootDirectory).eql(ernHomePath);
    });

    it('should return the default ern home path if process.env.ERN_HOME is not set', () => {
      delete process.env.ERN_HOME;
      expect(Platform.rootDirectory).eql(path.join(os.homedir(), '.ern'));
    });
  });

  describe('packagesCacheDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.packagesCacheDirectory).eql(
        path.join(ernHomePath, 'packages-cache'),
      );
    });
  });

  describe('cauldronDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.cauldronDirectory).eql(
        path.join(ernHomePath, 'cauldron'),
      );
    });
  });

  describe('localCauldronsDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.localCauldronsDirectory).eql(
        path.join(ernHomePath, 'local-cauldrons'),
      );
    });
  });

  describe('masterManifestDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.masterManifestDirectory).eql(
        path.join(ernHomePath, 'ern-master-manifest'),
      );
    });
  });

  describe('overrideManifestDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.overrideManifestDirectory).eql(
        path.join(ernHomePath, 'ern-override-manifest'),
      );
    });
  });

  describe('versionCacheDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.versionCacheDirectory).eql(
        path.join(ernHomePath, 'versions'),
      );
    });
  });

  describe('containerPublishersCacheDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.containerPublishersCacheDirectory).eql(
        path.join(ernHomePath, 'container-publishers-cache'),
      );
    });
  });

  describe('containerTransformersCacheDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.containerTransformersCacheDirectory).eql(
        path.join(ernHomePath, 'container-transformers-cache'),
      );
    });
  });

  describe('containerGenDirectory', () => {
    it('should return the correct path', () => {
      expect(Platform.containerGenDirectory).eql(
        path.join(ernHomePath, 'containergen'),
      );
    });
  });

  describe('getContainerGenOutDirectory', () => {
    it('should return the correct path for android', () => {
      expect(Platform.getContainerGenOutDirectory('android')).eql(
        path.join(ernHomePath, 'containergen/out/android'),
      );
    });

    it('should return the correct path for ios', () => {
      expect(Platform.getContainerGenOutDirectory('ios')).eql(
        path.join(ernHomePath, 'containergen/out/ios'),
      );
    });
  });

  describe('latestVersion', () => {
    it('should return 3.0.0', () => {
      expect(Platform.latestVersion).eql('3.0.0');
    });
  });

  describe('currentPlatformVersionPath', () => {
    it('should return the correct platform version path', () => {
      sandbox.stub(config, 'get').callsFake((key) => {
        if (key === 'platformVersion') {
          return '3.0.0';
        }
      });
      expect(Platform.currentPlatformVersionPath).eql(
        path.join(ernHomePath, 'versions/3.0.0/node_modules'),
      );
    });
  });

  describe('currentVersion', () => {
    it('should return the current version', () => {
      sandbox.stub(config, 'get').callsFake((key) => {
        if (key === 'platformVersion') {
          return '3.0.0';
        }
      });
      expect(Platform.currentVersion).eql('3.0.0');
    });
  });

  describe('isPlatformVersionAvailable', () => {
    it('should return true if the platform version is available', () => {
      expect(Platform.isPlatformVersionAvailable('2.0.0')).true;
    });

    it('should return false if the platform version is not available', () => {
      expect(Platform.isPlatformVersionAvailable('4.0.0')).false;
    });
  });

  describe('getRootPlatformVersionPath', () => {
    it('should return the correct root platform version path', () => {
      expect(Platform.getRootPlatformVersionPath('3.0.0')).eql(
        path.join(ernHomePath, 'versions/3.0.0'),
      );
    });
  });

  describe('getPlatformVersionPath', () => {
    it('should return the correct platform version path for version 1000.0.0', () => {
      expect(Platform.getPlatformVersionPath('1000.0.0')).eql(
        path.join(ernHomePath, 'versions/1000.0.0'),
      );
    });

    it('should return the correct platform version path for a version different from 1000.0.0', () => {
      expect(Platform.getPlatformVersionPath('3.0.0')).eql(
        path.join(ernHomePath, 'versions/3.0.0/node_modules'),
      );
    });
  });

  describe('versions', () => {
    it('should return the list of versions in ascending order', () => {
      expect(Platform.versions).eql(['1.0.0', '1.0.1', '2.0.0', '3.0.0']);
    });
  });

  describe('installPlatform', () => {
    it('should throw if the platform version is not available', () => {
      expect(() => Platform.installPlatform('6.0.0')).to.throw;
    });

    it('should use yarn init to create a package.json', () => {
      Platform.installPlatform('3.0.0');
      sandbox.assert.calledWith(
        execSyncStub,
        'yarn init --yes',
        sinon.match.any,
      );
    });

    it('should use npm init to create a package.json', () => {
      isYarnInstalledReturn = false;
      Platform.installPlatform('3.0.0');
      sandbox.assert.calledWith(
        execSyncStub,
        'npm init --yes',
        sinon.match.any,
      );
    });

    it('should use yarn add to install platform if yarn is installed', () => {
      Platform.installPlatform('3.0.0');
      sandbox.assert.calledWith(
        execSyncStub,
        'yarn add ern-local-cli@3.0.0 --exact --ignore-engines',
        sinon.match.any,
      );
    });

    it('should use npm install to install platform if yarn is not installed', () => {
      isYarnInstalledReturn = false;
      Platform.installPlatform('3.0.0');
      sandbox.assert.calledWith(
        execSyncStub,
        'npm install ern-local-cli@3.0.0 --exact',
        sinon.match.any,
      );
    });

    it('should throw something went wrong during install', () => {
      throwOnExecSync = true;
      expect(() => Platform.installPlatform('3.0.0')).to.throw;
    });

    it('should remove the version directory if something went wrong during install', () => {
      throwOnExecSync = true;
      try {
        Platform.installPlatform('3.0.0');
      } catch (e) {
        // noop
      }
      expect(
        fs.existsSync(path.join(ernHomePath, 'versions/3.0.0/node_modules')),
      ).false;
    });
  });

  describe('uninstallPlatform', () => {
    it('should not do anything if the platform version is not installed', () => {
      sandbox.stub(config, 'get').callsFake((key) => {
        if (key === 'platformVersion') {
          return '3.0.0';
        }
      });
      Platform.uninstallPlatform('3.0.0');
    });

    it('should not do anything if the platform version is the current one', () => {
      shell.mkdir(
        '-p',
        path.join(path.join(ernHomePath, 'versions/3.0.0/node_modules')),
      );
      sandbox.stub(config, 'get').callsFake((key) => {
        if (key === 'platformVersion') {
          return '3.0.0';
        }
      });
      Platform.uninstallPlatform('3.0.0');
    });

    it('should remove the version directory', () => {
      shell.mkdir(
        '-p',
        path.join(path.join(ernHomePath, 'versions/3.0.0/node_modules')),
      );
      sandbox.stub(config, 'get').callsFake((key) => {
        if (key === 'platformVersion') {
          return '2.0.0';
        }
      });
      Platform.uninstallPlatform('3.0.0');
      expect(fs.existsSync(path.join(ernHomePath, 'versions/3.0.0'))).false;
    });
  });

  describe('normalizeVersion', () => {
    it('should return 3.0.0 version for latest', () => {
      expect(Platform.normalizeVersion('latest')).eql('3.0.0');
    });

    it('should return 2.0.0 version for v2.0.0', () => {
      expect(Platform.normalizeVersion('v2.0.0')).eql('2.0.0');
    });

    it('should throw for invalid version', () => {
      expect(() => Platform.normalizeVersion('r.1.0')).to.throw;
    });
  });
});

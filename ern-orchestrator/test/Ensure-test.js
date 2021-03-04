import { assert, expect } from 'chai';
import * as cauldron from 'ern-cauldron-api';
import {
  AppVersionDescriptor,
  createTmpDir,
  PackagePath,
  utils,
} from 'ern-core';
import { getContainerMetadataPath } from 'ern-container-gen';
import { rejects } from 'assert';
import sinon from 'sinon';
import Ensure from '../src/Ensure';
import * as fixtures from './fixtures/common';
import * as coreFixtures from '../../ern-core/test/fixtures/common';
import fs from 'fs';
import path from 'path';

const sandbox = sinon.createSandbox();

const descriptor = AppVersionDescriptor.fromString('app:android:1.0.0');

let cauldronHelperStub;

describe('Ensure.js', () => {
  beforeEach(() => {
    cauldronHelperStub = sandbox.createStubInstance(cauldron.CauldronHelper);
    sandbox.stub(cauldron, 'getActiveCauldron').resolves(cauldronHelperStub);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('noGitOrFilesystemPath', () => {
    fixtures.withoutGitOrFileSystemPath.forEach((obj) => {
      it('should not throw if no git or file system path', () => {
        expect(
          () => Ensure.noGitOrFilesystemPath(obj),
          `throw for ${obj}`,
        ).to.not.throw();
      });
    });

    fixtures.withGitOrFileSystemPath.forEach((obj) => {
      it('should throw if git or file system path', () => {
        expect(
          () => Ensure.noGitOrFilesystemPath(obj),
          `does not throw for ${obj}`,
        ).to.throw();
      });
    });
  });

  describe('noFileSystemPath', () => {
    fixtures.withoutFileSystemPath.forEach((obj) => {
      it('should not throw if no file system path', () => {
        expect(
          () => Ensure.noFileSystemPath(obj),
          `throw for ${obj}`,
        ).to.not.throw();
      });
    });

    fixtures.withFileSystemPath.forEach((obj) => {
      it('should throw if file system path', () => {
        expect(
          () => Ensure.noFileSystemPath(obj),
          `does not throw for ${obj}`,
        ).to.throw();
      });
    });
  });

  describe('napDescritorExistsInCauldron', () => {
    it('should not throw if nap descriptor exists in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(true);
      await Ensure.napDescritorExistsInCauldron('testapp:android:1.0.0');
    });

    it('should not throw if nap descriptors exists in Cauldron [array]', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(true);
      await Ensure.napDescritorExistsInCauldron(['testapp:android:1.0.0']);
    });

    it('should throw if nap descriptor does not exist in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(false);
      assert(
        rejects(Ensure.napDescritorExistsInCauldron('testapp:android:1.0.0')),
      );
    });

    it('should throw if nap descriptor does not exist in Cauldron [array]', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(false);
      assert(
        rejects(Ensure.napDescritorExistsInCauldron(['testapp:android:1.0.0'])),
      );
    });
  });

  describe('napDescritorDoesNotExistsInCauldron', () => {
    it('should throw if nap descriptor exists in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(true);
      assert(
        rejects(
          Ensure.napDescritorDoesNotExistsInCauldron('testapp:android:1.0.0'),
        ),
      );
    });

    it('should not throw if nap descriptor does not exist in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(false);
      await Ensure.napDescritorDoesNotExistsInCauldron('testapp:android:1.0.0');
    });
  });

  describe('dependencyNotInNativeApplicationVersionContainer', () => {
    it('should throw if dependency is in native application version Container', async () => {
      cauldronHelperStub.isNativeDependencyInContainer.resolves(true);
      assert(
        rejects(
          Ensure.dependencyNotInNativeApplicationVersionContainer(
            'dep-a@1.0.0',
            descriptor,
          ),
        ),
      );
    });

    it('should not throw if dependency is not in native application version Container', async () => {
      cauldronHelperStub.isNativeDependencyInContainer.resolves(false);
      await Ensure.dependencyNotInNativeApplicationVersionContainer(
        'dep-b@1.0.0',
        descriptor,
      );
    });

    it('should not throw if dependency is undefined', async () => {
      await Ensure.dependencyNotInNativeApplicationVersionContainer(
        undefined,
        descriptor,
      );
    });
  });

  describe('dependencyIsOrphaned', async () => {
    it('should throw if dependency is not orphaned', async () => {
      cauldronHelperStub.getYarnLock.resolves(
        fs.readFileSync(path.join(__dirname, 'fixtures/sample.yarn.lock')),
      );
      assert(rejects(Ensure.dependencyIsOrphaned('dep-b', descriptor)));
    });

    it('should not throw if dependency is orphaned [not in lock file]', async () => {
      cauldronHelperStub.getYarnLock.resolves(
        fs.readFileSync(path.join(__dirname, 'fixtures/sample.yarn.lock')),
      );
      await Ensure.dependencyIsOrphaned('dep-d', descriptor);
    });

    it('should not throw if dependency is orphaned [in lock file]', async () => {
      cauldronHelperStub.getYarnLock.resolves(
        fs.readFileSync(path.join(__dirname, 'fixtures/sample.yarn.lock')),
      );
      await Ensure.dependencyIsOrphaned('dep-x', descriptor);
    });
  });

  describe('dependencyNotInUseByAMiniApp', () => {
    it('should not throw if dependency is undefined', async () => {
      await Ensure.dependencyNotInUseByAMiniApp(undefined, descriptor);
    });
  });

  describe('dependencyIsInNativeApplicationVersionContainer', () => {
    it('should not throw if dependency is in native application version Container', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('dep-a@1.0.0'),
      );
      await Ensure.dependencyIsInNativeApplicationVersionContainer(
        'dep-a@1.0.0',
        descriptor,
      );
    });

    it('should throw if dependency is not in native application version Container', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(undefined);
      assert(
        rejects(
          Ensure.dependencyIsInNativeApplicationVersionContainer(
            'dep-b@1.0.0',
            descriptor,
          ),
        ),
      );
    });

    it('should not throw if dependency is undefined', async () => {
      await Ensure.dependencyIsInNativeApplicationVersionContainer(
        undefined,
        descriptor,
      );
    });
  });

  describe('miniAppIsInNativeApplicationVersionContainer', () => {
    it('should not throw if MiniApp is in native application version Container', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true);
      await Ensure.miniAppIsInNativeApplicationVersionContainer(
        'miniapp@1.0.0',
        descriptor,
      );
    });

    it('should not throw for undefined MiniApp', async () => {
      await Ensure.miniAppIsInNativeApplicationVersionContainer(
        undefined,
        descriptor,
      );
    });

    it('should not throw for null MiniApp', async () => {
      await Ensure.miniAppIsInNativeApplicationVersionContainer(
        null,
        descriptor,
      );
    });

    it('should throw if MiniApp is not in native application version Container', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(false);
      assert(
        rejects(
          Ensure.miniAppIsInNativeApplicationVersionContainer(
            'miniapp@1.0.0',
            descriptor,
          ),
        ),
      );
    });
  });

  describe('miniAppIsInNativeApplicationVersionContainerWithDifferentVersion', () => {
    it('should not throw if miniapp is in native application version Container with different version', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true);
      cauldronHelperStub.getContainerMiniApp.resolves('miniapp@2.0.0');
      await Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
        'miniapp@1.0.0',
        descriptor,
      );
    });

    it('should not throw if miniapp is undefined', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true);
      cauldronHelperStub.getContainerMiniApp.resolves('miniapp@2.0.0');
      await Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
        undefined,
        descriptor,
      );
    });

    it('should throw if miniapp is in native application version Container with same version', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true);
      cauldronHelperStub.getContainerMiniApp.resolves('miniapp@1.0.0');
      assert(
        rejects(
          Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion(
            'miniapp@1.0.0',
            descriptor,
          ),
        ),
      );
    });
  });

  describe('dependencyIsInNativeApplicationVersionContainerWithDifferentVersion', () => {
    it('should not throw if dependency is in native application version Container with different version', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('dep-a@2.0.0'),
      );
      await Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
        'dep-a@1.0.0',
        descriptor,
      );
    });

    it('should not throw if dependency is undefined', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('dep-a@2.0.0'),
      );
      await Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
        undefined,
        descriptor,
      );
    });

    it('should throw if dependency is in native application version Container with same version', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('dep-a@1.0.0'),
      );
      assert(
        rejects(
          Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion(
            'dep-a@1.0.0',
            descriptor,
          ),
        ),
      );
    });
  });

  describe('miniAppNotInNativeApplicationVersionContainer', () => {
    it('should not throw for undefined MiniApp', async () => {
      await Ensure.miniAppNotInNativeApplicationVersionContainer(
        undefined,
        descriptor,
      );
    });

    it('should not throw for null MiniApp', async () => {
      await Ensure.miniAppNotInNativeApplicationVersionContainer(
        null,
        descriptor,
      );
    });
  });

  describe('publishedToNpm', () => {
    it('should not throw if dependency is published to npm', async () => {
      sandbox.stub(utils, 'isPublishedToNpm').resolves(true);
      await Ensure.publishedToNpm('dep@1.0.0');
    });

    it('should throw if dependency is not published to npm', async () => {
      sandbox.stub(utils, 'isPublishedToNpm').resolves(false);
      assert(rejects(Ensure.publishedToNpm('dep@1.0.0')));
    });
  });

  /*describe('cauldronIsActive', () => {
    it('should not throw if a cauldron is active', async () => {
      isActiveStub.returns(true)
      await Ensure.cauldronIsActive();
    })

    it('should throw if no cauldron is active', async() => {
      isActiveStub.returns(false)
      assert(rejects(Ensure.cauldronIsActive()))
    })
  })*/

  describe('isValidNpmPackageName', () => {
    fixtures.validNpmPackageNames.forEach((name) => {
      it('should not throw if name is valid', () => {
        expect(
          () => Ensure.isValidNpmPackageName(name),
          `throw for ${name}`,
        ).to.not.throw();
      });
    });

    fixtures.invalidNpmPackageNames.forEach((name) => {
      it('should throw if name is invalid', () => {
        expect(
          () => Ensure.isValidNpmPackageName(name),
          `does not throw for ${name}`,
        ).to.throw();
      });
    });
  });

  describe('isValidElectrodeNativeModuleName', () => {
    coreFixtures.validElectrodeNativeModuleNames.forEach((name) => {
      it('should not throw if name is valid', () => {
        expect(
          () => Ensure.isValidElectrodeNativeModuleName(name),
          `throw for ${name}`,
        ).to.not.throw();
      });
    });

    coreFixtures.invalidElectrodeNativeModuleNames.forEach((name) => {
      it('should throw if name is invalid', () => {
        expect(
          () => Ensure.isValidElectrodeNativeModuleName(name),
          `does not throw for ${name}`,
        ).to.throw();
      });
    });
  });

  describe('sameNativeApplicationAndPlatform', () => {
    it('should not throw if descriptors are matching the same native application and platform', () => {
      expect(() =>
        Ensure.sameNativeApplicationAndPlatform(
          fixtures.sameNativeApplicationPlatformDescriptors,
        ),
      ).to.not.throw();
    });

    it('should throw if descriptors are not matching the same native application and platform', () => {
      expect(() =>
        Ensure.sameNativeApplicationAndPlatform(
          fixtures.differentNativeApplicationPlatformDescriptors,
        ),
      ).to.throw();
    });
  });

  describe('checkIfCodePushOptionsAreValid', () => {
    it('should not throw if descriptors and semVerDescriptor are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          fixtures.differentNativeApplicationPlatformDescriptors,
          '',
          '1.0.0',
        ),
      ).to.not.throw();
    });

    it('should not throw if 1 descriptor and targetBinaryVersion are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          ['testapp:android:1.0.0'],
          '1.0.0',
        ),
      ).to.not.throw();
    });

    it('should throw if more than 1 descriptor and targetBinaryVersion are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          fixtures.differentNativeApplicationPlatformDescriptors,
          '1.0.0',
        ),
      ).to.throw();
    });

    it('should throw if 1 descriptor ,targetBinaryVersion and semVerDescriptor are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          ['testapp:android:1.0.0'],
          '1.0.0',
          '~1.0.0',
        ),
      ).to.throw();
    });
  });

  describe('pathExist', () => {
    it('should not throw if path exist', async () => {
      const tmpDirPath = createTmpDir();
      await Ensure.pathExist(tmpDirPath);
    });

    it('should throw if path does not exist', async () => {
      const tmpDirPath = createTmpDir();
      assert(rejects(Ensure.pathExist('/non/existing/path')));
    });
  });

  describe('isFilePath', () => {
    it('should not throw if path is a file', async () => {
      const tmpDirPath = createTmpDir();
      const tmpFilePath = path.join(tmpDirPath, 'file.test');
      const tmpFile = fs.writeFileSync(tmpFilePath, 'CONTENT');
      await Ensure.isFilePath(tmpFilePath);
    });

    it('should throw if path is not a file', async () => {
      const tmpDirPath = createTmpDir();
      assert(rejects(Ensure.isFilePath(tmpDirPath)));
    });

    it('should throw if path does not exist', async () => {
      const tmpDirPath = createTmpDir();
      assert(rejects(Ensure.isFilePath('/non/existing/path')));
    });
  });

  describe('isDirectoryPath', () => {
    it('should not throw if path is a  directory', async () => {
      const tmpDirPath = createTmpDir();
      await Ensure.isDirectoryPath(tmpDirPath);
    });

    it('should throw if path is not a directory', async () => {
      const tmpDirPath = createTmpDir();
      const tmpFilePath = path.join(tmpDirPath, 'file.test');
      const tmpFile = fs.writeFileSync(tmpFilePath, 'CONTENT');
      assert(rejects(Ensure.isDirectoryPath(tmpFilePath)));
    });

    it('should throw if path does not exist', async () => {
      const tmpDirPath = createTmpDir();
      assert(rejects(Ensure.isDirectoryPath('/non/existing/path')));
    });
  });

  describe('isSupportedMiniAppOrJsApiImplVersion', () => {
    fixtures.supportedCauldronMiniAppsVersions.forEach((pkg) => {
      it(`should not throw if supported version (pkg: ${pkg})`, () => {
        expect(
          () => Ensure.isSupportedMiniAppOrJsApiImplVersion(pkg),
          `throw for ${pkg}`,
        ).to.not.throw();
      });
    });

    fixtures.unSupportedCauldronMiniAppsVersions.forEach((pkg) => {
      it(`should throw if version is not supported (pkg: ${pkg})`, () => {
        expect(
          () => Ensure.isSupportedMiniAppOrJsApiImplVersion(pkg),
          `does not throw for ${pkg}`,
        ).to.throw();
      });
    });
  });

  describe('isContainerPath', () => {
    it('should not throw if path points to a container', async () => {
      const tmpDirPath = createTmpDir();
      fs.writeFileSync(
        getContainerMetadataPath(tmpDirPath),
        JSON.stringify('{}'),
      );
      Ensure.isContainerPath(tmpDirPath);
    });

    it('should throw if path does not points to a container', async () => {
      const tmpDirPath = createTmpDir();
      expect(() => Ensure.isContainerPath(tmpDirPath)).to.throw();
    });
  });
});

import { assert, expect } from 'chai'
import * as cauldron from 'ern-cauldron-api'
import { utils, createTmpDir, PackagePath } from 'ern-core'
import { getContainerMetadataPath } from 'ern-container-gen'
import { doesThrow, doesNotThrow } from 'ern-util-dev'
import sinon from 'sinon'
import Ensure from '../src/Ensure'
import * as fixtures from './fixtures/common'
const sandbox = sinon.createSandbox()
import fs from 'fs'
import path from 'path'

let cauldronHelperStub

describe('Ensure.js', () => {
  beforeEach(() => {
    cauldronHelperStub = sandbox.createStubInstance(cauldron.CauldronHelper)
    sandbox.stub(cauldron, 'getActiveCauldron').resolves(cauldronHelperStub)
  })

  afterEach(() => {
    sandbox.restore()
  })

  // ==========================================================
  // isValidContainerVersion
  // ==========================================================
  describe('isValidContainerVersion', () => {
    fixtures.validContainerVersions.forEach(version => {
      it('shoud not throw if version is valid', () => {
        expect(
          () => Ensure.isValidContainerVersion(version),
          `throw for ${version}`
        ).to.not.throw()
      })
    })

    fixtures.invalidContainerVersions.forEach(version => {
      it('should throw if version is invalid', () => {
        expect(
          () => Ensure.isValidContainerVersion(version),
          `does not throw for ${version}`
        ).to.throw()
      })
    })
  })

  // ==========================================================
  // noGitOrFilesystemPath
  // ==========================================================
  describe('noGitOrFilesystemPath', () => {
    fixtures.withoutGitOrFileSystemPath.forEach(obj => {
      it('shoud not throw if no git or file system path', () => {
        expect(
          () => Ensure.noGitOrFilesystemPath(obj),
          `throw for ${obj}`
        ).to.not.throw()
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(obj => {
      it('should throw if git or file system path', () => {
        expect(
          () => Ensure.noGitOrFilesystemPath(obj),
          `does not throw for ${obj}`
        ).to.throw()
      })
    })
  })

  // ==========================================================
  // noFileSystemPath
  // ==========================================================
  describe('noFileSystemPath', () => {
    fixtures.withoutFileSystemPath.forEach(obj => {
      it('shoud not throw if no file system path', () => {
        expect(
          () => Ensure.noFileSystemPath(obj),
          `throw for ${obj}`
        ).to.not.throw()
      })
    })

    fixtures.withFileSystemPath.forEach(obj => {
      it('should throw if file system path', () => {
        expect(
          () => Ensure.noFileSystemPath(obj),
          `does not throw for ${obj}`
        ).to.throw()
      })
    })
  })

  // ==========================================================
  // napDescritorExistsInCauldron
  // ==========================================================
  describe('napDescritorExistsInCauldron', () => {
    it('should not throw if nap descriptor exists in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(true)
      assert(
        await doesNotThrow(
          Ensure.napDescritorExistsInCauldron,
          null,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if nap descriptors exists in Cauldron [array]', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(true)
      assert(
        await doesNotThrow(Ensure.napDescritorExistsInCauldron, null, [
          'testapp:android:1.0.0',
        ])
      )
    })

    it('should throw if nap descriptor does not exist in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(false)
      assert(
        await doesThrow(
          Ensure.napDescritorExistsInCauldron,
          null,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should throw if nap descriptor does not exist in Cauldron [array]', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(false)
      assert(
        await doesThrow(Ensure.napDescritorExistsInCauldron, null, [
          'testapp:android:1.0.0',
        ])
      )
    })
  })

  // ==========================================================
  // napDescritorDoesNotExistsInCauldron
  // ==========================================================
  describe('napDescritorDoesNotExistsInCauldron', () => {
    it('should throw if nap descriptor exists in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(true)
      assert(
        await doesThrow(
          Ensure.napDescritorDoesNotExistsInCauldron,
          null,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if nap descriptor does not exist in Cauldron', async () => {
      cauldronHelperStub.isDescriptorInCauldron.resolves(false)
      assert(
        await doesNotThrow(
          Ensure.napDescritorDoesNotExistsInCauldron,
          null,
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // dependencyNotInNativeApplicationVersionContainer
  // ==========================================================
  describe('dependencyNotInNativeApplicationVersionContainer', () => {
    it('should throw if dependency is in native application version Container', async () => {
      cauldronHelperStub.isNativeDependencyInContainer.resolves(true)
      assert(
        await doesThrow(
          Ensure.dependencyNotInNativeApplicationVersionContainer,
          null,
          'depa@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if dependency is not in native application version Container', async () => {
      cauldronHelperStub.isNativeDependencyInContainer.resolves(false)
      assert(
        await doesNotThrow(
          Ensure.dependencyNotInNativeApplicationVersionContainer,
          null,
          'depB@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if dependency is undefined', async () => {
      assert(
        await doesNotThrow(
          Ensure.dependencyNotInNativeApplicationVersionContainer,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // dependencyIsOrphaned
  // ==========================================================
  describe('dependencyIsOrphaned', async () => {
    it('should throw if dependency is not orphaned', async () => {
      cauldronHelperStub.getYarnLock.resolves(
        fs.readFileSync(path.join(__dirname, 'fixtures/sample.yarn.lock'))
      )
      assert(
        await doesThrow(
          Ensure.dependencyIsOrphaned,
          null,
          'DependencyB',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if dependency is orphaned [not in lock file]', async () => {
      cauldronHelperStub.getYarnLock.resolves(
        fs.readFileSync(path.join(__dirname, 'fixtures/sample.yarn.lock'))
      )
      assert(
        await doesNotThrow(
          Ensure.dependencyIsOrphaned,
          null,
          'DependencyD',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if dependency is orphaned [in lock file]', async () => {
      cauldronHelperStub.getYarnLock.resolves(
        fs.readFileSync(path.join(__dirname, 'fixtures/sample.yarn.lock'))
      )
      assert(
        await doesNotThrow(
          Ensure.dependencyIsOrphaned,
          null,
          'DependencyOutOfLockFile',
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // dependencyNotInUseByAMiniApp
  // ==========================================================
  describe('dependencyNotInUseByAMiniApp', () => {
    it('should not throw if dependency is undefined', async () => {
      assert(
        await doesNotThrow(
          Ensure.dependencyNotInUseByAMiniApp,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // dependencyIsInNativeApplicationVersionContainer
  // ==========================================================
  describe('dependencyIsInNativeApplicationVersionContainer', () => {
    it('should not throw if dependency is in native application version Container', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('depA@1.0.0')
      )
      assert(
        await doesNotThrow(
          Ensure.dependencyIsInNativeApplicationVersionContainer,
          null,
          'depa@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should throw if dependency is not in native application version Container', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(undefined)
      assert(
        await doesThrow(
          Ensure.dependencyIsInNativeApplicationVersionContainer,
          null,
          'depB@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if dependency is undefined', async () => {
      assert(
        await doesNotThrow(
          Ensure.dependencyIsInNativeApplicationVersionContainer,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // miniAppIsInNativeApplicationVersionContainer
  // ==========================================================
  describe('miniAppIsInNativeApplicationVersionContainer', () => {
    it('should not throw if MiniApp is in native application version Container', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true)
      assert(
        await doesNotThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainer,
          null,
          'miniapp@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw for undefined MiniApp', async () => {
      assert(
        await doesNotThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainer,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw for null MiniApp', async () => {
      assert(
        await doesNotThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainer,
          null,
          null,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should throw if MiniApp is not in native application version Container', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(false)
      assert(
        await doesThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainer,
          null,
          'miniapp@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // miniAppIsInNativeApplicationVersionContainerWithDifferentVersion
  // ==========================================================
  describe('miniAppIsInNativeApplicationVersionContainerWithDifferentVersion', () => {
    it('should not throw if miniapp is in native application version Container with different version', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true)
      cauldronHelperStub.getContainerMiniApp.resolves('miniapp@2.0.0')
      assert(
        await doesNotThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
          null,
          'miniapp@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if miniapp is undefined', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true)
      cauldronHelperStub.getContainerMiniApp.resolves('miniapp@2.0.0')
      assert(
        await doesNotThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should throw if miniapp is in native application version Container with same version', async () => {
      cauldronHelperStub.isMiniAppInContainer.resolves(true)
      cauldronHelperStub.getContainerMiniApp.resolves('miniapp@1.0.0')
      assert(
        await doesThrow(
          Ensure.miniAppIsInNativeApplicationVersionContainerWithDifferentVersion,
          null,
          'miniapp@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // dependencyIsInNativeApplicationVersionContainerWithDifferentVersion
  // ==========================================================
  describe('dependencyIsInNativeApplicationVersionContainerWithDifferentVersion', () => {
    it('should not throw if dependency is in native application version Container with different version', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('depA@2.0.0')
      )
      assert(
        await doesNotThrow(
          Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion,
          null,
          'depA@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw if dependency is undefined', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('depA@2.0.0')
      )
      assert(
        await doesNotThrow(
          Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should throw if dependency is in native application version Container with same version', async () => {
      cauldronHelperStub.getContainerNativeDependency.resolves(
        PackagePath.fromString('depA@1.0.0')
      )
      assert(
        await doesThrow(
          Ensure.dependencyIsInNativeApplicationVersionContainerWithDifferentVersion,
          null,
          'depA@1.0.0',
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // miniAppNotInNativeApplicationVersionContainer
  // ==========================================================
  describe('miniAppNotInNativeApplicationVersionContainer', () => {
    it('should not throw for undefined MiniApp', async () => {
      assert(
        await doesNotThrow(
          Ensure.miniAppNotInNativeApplicationVersionContainer,
          null,
          undefined,
          'testapp:android:1.0.0'
        )
      )
    })

    it('should not throw for null MiniApp', async () => {
      assert(
        await doesNotThrow(
          Ensure.miniAppNotInNativeApplicationVersionContainer,
          null,
          null,
          'testapp:android:1.0.0'
        )
      )
    })
  })

  // ==========================================================
  // publishedToNpm
  // ==========================================================
  describe('publishedToNpm', () => {
    it('should not throw if dependency is published to npm', async () => {
      sandbox.stub(utils, 'isPublishedToNpm').resolves(true)
      assert(
        await doesNotThrow(Ensure.publishedToNpm, null, 'nonpublished@1.0.0')
      )
    })

    it('should throw if dependency is not published to npm', async () => {
      sandbox.stub(utils, 'isPublishedToNpm').resolves(false)
      assert(await doesThrow(Ensure.publishedToNpm, null, 'nonpublished@1.0.0'))
    })
  })

  // ==========================================================
  // cauldronIsActive
  // ==========================================================
  /*describe('cauldronIsActive', () => {
    it('should not throw if a cauldron is active', async () => {
      isActiveStub.returns(true)
      assert(await doesNotThrow(Ensure.cauldronIsActive))
    })

    it('should throw if no cauldron is active', async() => {
      isActiveStub.returns(false)
      assert(await doesThrow(Ensure.cauldronIsActive))
    })
  })*/

  // ==========================================================
  // isValidNpmPackageName
  // ==========================================================
  describe('isValidNpmPackageName', () => {
    fixtures.validNpmPackageNames.forEach(name => {
      it('shoud not throw if name is valid', () => {
        expect(
          () => Ensure.isValidNpmPackageName(name),
          `throw for ${name}`
        ).to.not.throw()
      })
    })

    fixtures.invalidNpmPackageNames.forEach(name => {
      it('should throw if name is invalid', () => {
        expect(
          () => Ensure.isValidNpmPackageName(name),
          `does not throw for ${name}`
        ).to.throw()
      })
    })
  })

  // ==========================================================
  // isValidElectrodeNativeModuleName
  // ==========================================================
  describe('isValidElectrodeNativeModuleName', () => {
    fixtures.validElectrodeNativeModuleNames.forEach(name => {
      it('should not throw if name is valid', () => {
        expect(
          () => Ensure.isValidElectrodeNativeModuleName(name),
          `throw for ${name}`
        ).to.not.throw()
      })
    })

    fixtures.invalidElectrodeNativeModuleNames.forEach(name => {
      it('should throw if name is invalid', () => {
        expect(
          () => Ensure.isValidElectrodeNativeModuleName(name),
          `does not throw for ${name}`
        ).to.throw()
      })
    })
  })

  // ==========================================================
  // sameNativeAplicationAndPlatform
  // ==========================================================
  describe('sameNativeAplicationAndPlatform', () => {
    it('should not throw if descriptors are matching the same native application and platform', () => {
      expect(() =>
        Ensure.sameNativeApplicationAndPlatform(
          fixtures.sameNativeApplicationPlatformDescriptors
        )
      ).to.not.throw()
    })

    it('should throw if descriptors are not matching the same native application and platform', () => {
      expect(() =>
        Ensure.sameNativeApplicationAndPlatform(
          fixtures.differentNativeApplicationPlatformDescriptors
        )
      ).to.throw()
    })
  })

  // ==========================================================
  // checkIfCodePushOptionsAreValid
  // ==========================================================
  describe('checkIfCodePushOptionsAreValid', () => {
    it('should not throw if descriptors and semVerDescriptor are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          fixtures.differentNativeApplicationPlatformDescriptors,
          '',
          '1.0.0'
        )
      ).to.not.throw()
    })

    it('should not throw if 1 descriptor and targetBinaryVersion are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          ['testapp:android:1.0.0'],
          '1.0.0'
        )
      ).to.not.throw()
    })

    it('should throw if more than 1 descriptor and targetBinaryVersion are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          fixtures.differentNativeApplicationPlatformDescriptors,
          '1.0.0'
        )
      ).to.throw()
    })

    it('should throw if 1 descriptor ,targetBinaryVersion and semVerDescriptor are specified', () => {
      expect(() =>
        Ensure.checkIfCodePushOptionsAreValid(
          ['testapp:android:1.0.0'],
          '1.0.0',
          '~1.0.0'
        )
      ).to.throw()
    })
  })

  // ==========================================================
  // pathExist
  // ==========================================================
  describe('pathExist', () => {
    it('should not throw if path exist', async () => {
      const tmpDirPath = createTmpDir()
      assert(await doesNotThrow(Ensure.pathExist, Ensure, tmpDirPath))
    })

    it('should throw if path does not exist', async () => {
      const tmpDirPath = createTmpDir()
      assert(await doesThrow(Ensure.pathExist, Ensure, '/non/existing/path'))
    })
  })

  // ==========================================================
  // isFilePath
  // ==========================================================
  describe('isFilePath', () => {
    it('should not throw if path is a file', async () => {
      const tmpDirPath = createTmpDir()
      const tmpFilePath = path.join(tmpDirPath, 'file.test')
      const tmpFile = fs.writeFileSync(tmpFilePath, 'CONTENT')
      assert(await doesNotThrow(Ensure.isFilePath, Ensure, tmpFilePath))
    })

    it('should throw if path is not a file', async () => {
      const tmpDirPath = createTmpDir()
      assert(await doesThrow(Ensure.isFilePath, Ensure, tmpDirPath))
    })

    it('should throw if path does not exist', async () => {
      const tmpDirPath = createTmpDir()
      assert(await doesThrow(Ensure.isFilePath, Ensure, '/non/existing/path'))
    })
  })

  // ==========================================================
  // isDirectoryPath
  // ==========================================================
  describe('isDirectoryPath', () => {
    it('should not throw if path is a  directory', async () => {
      const tmpDirPath = createTmpDir()
      assert(await doesNotThrow(Ensure.isDirectoryPath, Ensure, tmpDirPath))
    })

    it('should throw if path is not a directory', async () => {
      const tmpDirPath = createTmpDir()
      const tmpFilePath = path.join(tmpDirPath, 'file.test')
      const tmpFile = fs.writeFileSync(tmpFilePath, 'CONTENT')
      assert(await doesThrow(Ensure.isDirectoryPath, Ensure, tmpFilePath))
    })

    it('should throw if path does not exist', async () => {
      const tmpDirPath = createTmpDir()
      assert(
        await doesThrow(Ensure.isDirectoryPath, Ensure, '/non/existing/path')
      )
    })
  })

  // ==========================================================
  // isSupportedMiniAppOrJsApiImplVersion
  // ==========================================================
  describe('isSupportedMiniAppOrJsApiImplVersion', () => {
    fixtures.supportedCauldronMiniAppsVersions.forEach(pkg => {
      it('shoud not throw if suported version', () => {
        expect(
          () => Ensure.isSupportedMiniAppOrJsApiImplVersion(pkg),
          `throw for ${pkg}`
        ).to.not.throw()
      })
    })

    fixtures.unSupportedCauldronMiniAppsVersions.forEach(pkg => {
      it('should throw if version is not supported', () => {
        expect(
          () => Ensure.isSupportedMiniAppOrJsApiImplVersion(pkg),
          `does not throw for ${pkg}`
        ).to.throw()
      })
    })
  })

  // ==========================================================
  // isContainerPath
  // ==========================================================
  describe('isContainerPath', () => {
    it('should not throw if path points to a container', async () => {
      const tmpDirPath = createTmpDir()
      fs.writeFileSync(
        getContainerMetadataPath(tmpDirPath),
        JSON.stringify('{}')
      )
      assert(await doesNotThrow(Ensure.isContainerPath, Ensure, tmpDirPath))
    })

    it('should throw if path does not points to a container', async () => {
      const tmpDirPath = createTmpDir()
      assert(await doesThrow(Ensure.isContainerPath, Ensure, tmpDirPath))
    })
  })
})

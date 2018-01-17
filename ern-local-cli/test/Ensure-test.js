// @flow 

import {
  assert,
  expect
} from 'chai'
import {
  CauldronHelper,
  utils
} from 'ern-core'
import {
  doesThrow,
  doesNotThrow
} from 'ern-util-dev'
import sinon from 'sinon'
import Ensure from '../src/lib/Ensure'
import * as fixtures from './fixtures/common'
const sandbox = sinon.createSandbox()

let cauldronHelperStub

describe('Ensure.js', () => {
  beforeEach(() => {
    cauldronHelperStub = sandbox.createStubInstance(CauldronHelper)
    sandbox.stub(utils, 'getCauldronInstance').resolves(cauldronHelperStub)
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
        expect(() => Ensure.isValidContainerVersion(version), `throw for ${version}`).to.not.throw()
      })
    })

    fixtures.invalidContainerVersions.forEach(version => {
      it('should throw if version is invalid', () => {
        expect(() => Ensure.isValidContainerVersion(version), `does not throw for ${version}`).to.throw()
      })
    })
  })

  // ==========================================================
  // isCompleteNapDescriptorString
  // ==========================================================
  describe('isCompleteNapDescriptorString', () => {
    fixtures.completeNapDescriptors.forEach(napDescriptor => {
      it('shoud not throw if given a complete napDescriptor string', () => {
        expect(() => Ensure.isCompleteNapDescriptorString(napDescriptor), `throw for ${napDescriptor}`).to.not.throw()
      })
    })

    fixtures.incompleteNapDescriptors.forEach(napDescriptor => {
      it('should throw if given a partial napDescriptor string', () => {
        expect(() => Ensure.isCompleteNapDescriptorString(napDescriptor), `does not throw for ${napDescriptor}`).to.throw()
      })
    })
  })

  // ==========================================================
  // noGitOrFilesystemPath
  // ==========================================================
  describe('noGitOrFilesystemPath', () => {
    fixtures.withoutGitOrFileSystemPath.forEach(obj => {
      it('shoud not throw if no git or file system path', () => {
        expect(() => Ensure.noGitOrFilesystemPath(obj), `throw for ${obj}`).to.not.throw()
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(obj => {
      it('should throw if git or file system path', () => {
        expect(() => Ensure.noGitOrFilesystemPath(obj), `does not throw for ${obj}`).to.throw()
      })
    })
  })

  // ==========================================================
  // noFileSystemPath
  // ==========================================================
  describe('noFileSystemPath', () => {
    fixtures.withoutFileSystemPath.forEach(obj => {
      it('shoud not throw if no file system path', () => {
        expect(() => Ensure.noFileSystemPath(obj), `throw for ${obj}`).to.not.throw()
      })
    })

    fixtures.withFileSystemPath.forEach(obj => {
      it('should throw if file system path', () => {
        expect(() => Ensure.noFileSystemPath(obj), `does not throw for ${obj}`).to.throw()
      })
    })
  })

  // ==========================================================
  // napDescritorExistsInCauldron
  // ==========================================================
  describe('napDescritorExistsInCauldron', () => {
    it('should not throw if nap descriptor exists in Cauldron', async () => {
      cauldronHelperStub.getNativeApp.resolves({})
      assert(await doesNotThrow(Ensure.napDescritorExistsInCauldron, null, 'testapp:android:1.0.0'))
    })

    it('should throw if nap descriptor does not exist in Cauldron', async () => {
      cauldronHelperStub.getNativeApp.resolves(undefined)
      assert(await doesThrow(Ensure.napDescritorExistsInCauldron, null, 'testapp:android:1.0.0'))
    })
  })

  // ==========================================================
  // publishedToNpm
  // ==========================================================
  describe('publishedToNpm', () => {
    it('should not throw if dependency is published to npm', async () => {
      sandbox.stub(utils, 'isPublishedToNpm').resolves(true)
      assert(await doesNotThrow(Ensure.publishedToNpm, null, 'nonpublished@1.0.0'))
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
        expect(() => Ensure.isValidNpmPackageName(name), `throw for ${name}`).to.not.throw()
      })
    })

    fixtures.invalidNpmPackageNames.forEach(name => {
      it('should throw if name is invalid', () => {
        expect(() => Ensure.isValidNpmPackageName(name), `does not throw for ${name}`).to.throw()
      })
    })
  })

  // ==========================================================
  // isValidElectrodeNativeModuleName
  // ==========================================================
  describe('isValidElectrodeNativeModuleName', () => {
    fixtures.validElectrodeNativeModuleNames.forEach(name => {
      it('should not throw if name is valid', () => {
        expect(() => Ensure.isValidElectrodeNativeModuleName(name), `throw for ${name}`).to.not.throw()
      })
    })

    fixtures.invalidElectrodeNativeModuleNames.forEach(name => {
      it('should throw if name is invalid', () => {
        expect(() => Ensure.isValidElectrodeNativeModuleName(name), `does not throw for ${name}`).to.throw()
      })
    })
  })

  // ==========================================================
  // sameNativeAplicationAndPlatform
  // ==========================================================
  describe('sameNativeAplicationAndPlatform', () => {
    it('should not throw if descriptors are matching the same native application and platform', () => {
      expect(() => Ensure.sameNativeApplicationAndPlatform(fixtures.sameNativeApplicationPlatformDescriptors)).to.not.throw()
    })
    
    it('should throw if descriptors are not matching the same native application and platforn', () => {
      expect(() => Ensure.sameNativeApplicationAndPlatform(fixtures.differentNativeApplicationPlatformDescriptors)).to.throw()
    })
  })
})
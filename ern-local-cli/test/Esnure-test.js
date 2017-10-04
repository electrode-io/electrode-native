import {
  assert,
  expect
} from 'chai'
import {
  cauldron,
  utils
} from 'ern-core'
import sinon from 'sinon'
import Ensure from '../src/lib/Ensure'
import * as fixtures from './fixtures/common'

const getNativeAppStub = sinon.stub(cauldron, 'getNativeApp')
const isPublishedToNpmStub = sinon.stub(utils, 'isPublishedToNpm')
let cauldronIsActiveStub

function resolveCauldronGetNativeAppWith(data) {
  getNativeAppStub.resolves(data)
}

beforeEach(() => {
  isPublishedToNpmStub.reset()
})

afterEach(() => {
  cauldronIsActiveStub && cauldronIsActiveStub.restore()
})

after(() => {
  getNativeAppStub.restore()
  isPublishedToNpmStub.restore()
})

// Utility function that returns true if a given async function execution
// throws an exception, false otherwise
// DUPLICATE : TO BE MOVED TO ERN-UTIL-DEV
async function doesThrow (asyncFn, ...args) {
  let threwError = false
  try {
    await asyncFn(...args)
  } catch (e) {
    threwError = true
  }
  return threwError === true
}

async function doesNotThrow (asyncFn, ... args) {
  let threwError = false
  try {
    await asyncFn(...args)
  } catch (e) {
    threwError = true
  }
  return threwError === false
}

describe('Ensure.js', () => {
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
  // napDescritorExistsInCauldron
  // ==========================================================
  describe('napDescritorExistsInCauldron', () => {
    it('should not throw if nap descriptor exists in Cauldron', async () => {
      resolveCauldronGetNativeAppWith({})
      assert(await doesNotThrow(Ensure.napDescritorExistsInCauldron, 'testapp:android:1.0.0'))
    })

    it('should throw if nap descriptor does not exist in Cauldron', async () => {
      resolveCauldronGetNativeAppWith(undefined)
      assert(await doesThrow(Ensure.napDescritorExistsInCauldron, 'testapp:android:1.0.0'))
    })
  })


  // ==========================================================
  // publishedToNpm
  // ==========================================================
  describe('publishedToNpm', () => {
    it('should not throw if dependency is published to npm', async () => {
      isPublishedToNpmStub.resolves(true)
      assert(await doesNotThrow(Ensure.publishedToNpm, 'nonpublished@1.0.0'))
    })

    it('should throw if dependency is not published to npm', async () => {
      isPublishedToNpmStub.resolves(false)
      assert(await doesThrow(Ensure.publishedToNpm, 'nonpublished@1.0.0'))
    })
  })

  // ==========================================================
  // cauldronIsActive
  // ==========================================================
  describe('cauldronIsActive', () => {
    it('should not throw if a cauldron is active', () => {
      cauldronIsActiveStub = sinon.stub(cauldron, 'isActive').returns(true)
      expect(() => Ensure.cauldronIsActive(), `does throw when cauldron is active`).to.not.throw()
    })

    it('should throw if no cauldron is active', () => {
      cauldronIsActiveStub = sinon.stub(cauldron, 'isActive').returns(false)
      expect(() => Ensure.cauldronIsActive(), `does not throw when cauldron is not active`).to.throw()
    })
  })
})
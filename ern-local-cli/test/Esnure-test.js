import {
  assert,
  expect
} from 'chai'
import Ensure from '../src/lib/Ensure'
import * as fixtures from './fixtures/common'

describe('Ensure.js', () => {
  // ==========================================================
  // isValidContainerVersion
  // ==========================================================
  describe('isValidContainerVersion', () => {
    fixtures.validContainerVersions.forEach(version => {
      it('shoud not throw if version is valid', () => {
        expect(() => Ensure.isValidContainerVersion(version), `throw for ${version}`).to.not.throw
      })
    })

    fixtures.invalidContainerVersions.forEach(version => {
      it('should throw if version is invalid', () => {
        expect(() => Ensure.isValidContainerVersion(version), `does not throw for ${version}`).to.throw
      })
    })
  })

  // ==========================================================
  // isCompleteNapDescriptorString
  // ==========================================================
  describe('isCompleteNapDescriptorString', () => {
    fixtures.completeNapDescriptors.forEach(napDescriptor => {
      it('shoud not throw if given a complete napDescriptor string', () => {
        expect(() => Ensure.isCompleteNapDescriptorString(napDescriptor), `throw for ${napDescriptor}`).to.not.throw
      })
    })

    fixtures.incompleteNapDescriptors.forEach(napDescriptor => {
      it('should throw if given a partial napDescriptor string', () => {
        expect(() => Ensure.isCompleteNapDescriptorString(napDescriptor), `does not throw for ${napDescriptor}`).to.throw
      })
    })
  })

  // ==========================================================
  // noGitOrFilesystemPath
  // ==========================================================
  describe('noGitOrFilesystemPath', () => {
    fixtures.withoutGitOrFileSystemPath.forEach(obj => {
      it('shoud not throw if no git or file system path', () => {
        expect(() => Ensure.noGitOrFilesystemPath(obj), `throw for ${obj}`).to.not.throw
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(obj => {
      it('should throw if git or file system path', () => {
        expect(() => Ensure.noGitOrFilesystemPath(obj), `does not throw for ${obj}`).to.throw
      })
    })
  })
})
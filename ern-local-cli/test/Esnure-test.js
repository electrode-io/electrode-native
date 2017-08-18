import {
  assert,
  expect
} from 'chai'
import Ensure from '../src/lib/Ensure'

describe('Ensure.js', () => {
  // ==========================================================
  // isValidContainerVersion
  // ==========================================================
  const validContainerVersions = [ 
    '1.2.3', 
    '0.0.0', 
    '123.456.789'
  ]
  const invalidContainerVersions = [ 
    '123',
    '1.2',
    '1.2.x',
    'x.y.z',
    undefined,
    null,
    0
  ]

  describe('isValidContainerVersion', () => {
    validContainerVersions.forEach(version => {
      it('shoud not throw if version is valid', () => {
        expect(() => Ensure.isValidContainerVersion(version), `throw for ${version}`).to.not.throw
      })
    })

    invalidContainerVersions.forEach(version => {
      it('should throw if version is invalid', () => {
        expect(() => Ensure.isValidContainerVersion(version), `does not throw for ${version}`).to.throw
      })
    })
  })

  // ==========================================================
  // isCompleteNapDescriptorString
  // ==========================================================
  const completeNapDescriptors = [
    'myapp:android:17.14.0',
    'myapp:ios:1'
  ]

  const incompleteNapDescriptors = [
    'myapp',
    'myapp:android'
  ]

  describe('isCompleteNapDescriptorString', () => {
    completeNapDescriptors.forEach(napDescriptor => {
      it('shoud not throw if given a complete napDescriptor string', () => {
        expect(() => Ensure.isCompleteNapDescriptorString(napDescriptor), `throw for ${napDescriptor}`).to.not.throw
      })
    })

    incompleteNapDescriptors.forEach(napDescriptor => {
      it('should throw if given a partial napDescriptor string', () => {
        expect(() => Ensure.isCompleteNapDescriptorString(napDescriptor), `does not throw for ${napDescriptor}`).to.throw
      })
    })
  })

  // ==========================================================
  // noGitOrFilesystemPath
  // ==========================================================
  const withoutGitOrFileSystemPath = [
    'package@1.2.3',
    '@scope/package@1.2.3',
    [ 'package@1.2.3', '@scope/package@1.2.3' ]
  ]

  const withGitOrFileSystemPath = [
    'git+ssh://github.com:electrode/react-native.git',
    'git@github.com:electrode/react-native.git',
    'file:/Users/username',
    [ 'package@1.2.3', '@scope/package@1.2.3', 'git+ssh://github.com:electrode/react-native.git' ],
    [ 'package@1.2.3', '@scope/package@1.2.3', 'file:/Users/username' ],
    [ 'git+ssh://github.com:electrode/react-native.git', 'file:/Users/username' ]
  ]

  describe('noGitOrFilesystemPath', () => {
    withoutGitOrFileSystemPath.forEach(obj => {
      it('shoud not throw if no git or file system path', () => {
        expect(() => Ensure.noGitOrFilesystemPath(obj), `throw for ${obj}`).to.not.throw
      })
    })

    withGitOrFileSystemPath.forEach(obj => {
      it('should throw if git or file system path', () => {
        expect(() => Ensure.noGitOrFilesystemPath(obj), `does not throw for ${obj}`).to.throw
      })
    })
  })
})
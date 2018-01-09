// @flow

import {
  expect
} from 'chai'
import PackagePath from '../src/PackagePath'

describe('PackagePath', () => {
  const gitSshPath = 'git+ssh://git@github.com:electrode-io/electrode-native.git'
  const gitSshVersionPath =  'git+ssh://git@github.com:electrode-io/electrode-native.git#0.11.0'
  const gitHttpsPath = 'https://github.com/electrode-io/electrode-native.git'
  const gitHttpsVersionPath = 'https://github.com/electrode-io/electrode-native.git#0.11.0'
  const fileSystemPath = 'file:/Users/blemair/Code/electrode-native'
  const fileSystemPathWithoutPrefix = '/Users/blemair/Code/electrode-native'
  const registryPath = 'ern-local-cli'
  const registryVersionPath = 'ern-local-cli@0.11.0'

  describe('constructor', () => {
    it('should work for a git ssh path without version', () => {
      expect(() => new PackagePath(gitSshPath)).to.not.throw()
    })

    it('should work for a git ssh path with version', () => {
      expect(() => new PackagePath(gitSshVersionPath)).to.not.throw()
    })

    it('should work for a git https path without version', () => {
      expect(() => new PackagePath(gitHttpsPath)).to.not.throw()
    })

    it('should work for a git https path with version', () => {
      expect(() => new PackagePath(gitHttpsVersionPath)).to.not.throw()
    })

    it('should work for a file system path', () => {
      expect(() => new PackagePath(fileSystemPath)).to.not.throw()
    })

    it('should work for a file system path without prefix', () => {
      expect(() => new PackagePath(fileSystemPathWithoutPrefix)).to.not.throw()
    })

    it('should work for a registry path', () => {
      expect(() => new PackagePath(registryPath)).to.not.throw()
    })

    it('should work for a registry path with version', () => {
      expect(() => new PackagePath(registryVersionPath)).to.not.throw()
    })
  })

  describe('fromString', () => {
    it('should work for a git ssh path without version', () => {
      expect(() => PackagePath.fromString(gitSshPath)).to.not.throw()
    })

    it('should work for a git ssh path with version', () => {
      expect(() => PackagePath.fromString(gitSshVersionPath)).to.not.throw()
    })

    it('should work for a git https path without version', () => {
      expect(() => PackagePath.fromString(gitHttpsPath)).to.not.throw()
    })

    it('should work for a git https path with version', () => {
      expect(() => PackagePath.fromString(gitHttpsVersionPath)).to.not.throw()
    })

    it('should work for a file system path', () => {
      expect(() => PackagePath.fromString(fileSystemPath)).to.not.throw()
    })

    it('should work for a file system path without prefix', () => {
      expect(() => PackagePath.fromString(fileSystemPathWithoutPrefix)).to.not.throw()
    })

    it('should work for a registry path', () => {
      expect(() => PackagePath.fromString(registryPath)).to.not.throw()
    })

    it('should work for a registry path with version', () => {
      expect(() => PackagePath.fromString(registryVersionPath)).to.not.throw()
    })
  })

  describe('get version', () => {
    it('should return undefined for a file system package path', () => {
      expect(PackagePath.fromString(fileSystemPath).version).undefined
    })

    it('should return undefined for a file system package path without prefix', () => {
      expect(PackagePath.fromString(fileSystemPathWithoutPrefix).version).undefined
    })

    it('should return undefined for a git ssh path without version', () => {
      expect(PackagePath.fromString(gitSshPath).version).undefined
    })

    it('should return undefined for a git https path without version', () => {
      expect(PackagePath.fromString(gitHttpsPath).version).undefined
    })

    it('should return undefined for a registry path without version', () => {
      expect(PackagePath.fromString(registryPath).version).undefined
    })

    it('should return the proper version of for a git ssh path with version', () => {
      expect(PackagePath.fromString(gitSshVersionPath).version).eql('0.11.0')
    })

    it('should return the proper version of for a git https path with version', () => {
      expect(PackagePath.fromString(gitHttpsVersionPath).version).eql('0.11.0')
    })

    it('should return the proper version of for a registry path with version', () => {
      expect(PackagePath.fromString(registryVersionPath).version).eql('0.11.0')
    })
  })

  describe('get isGitPath', () => {
    it('should return false for a file system package path', () => {
      expect(PackagePath.fromString(fileSystemPath).isGitPath).false
    })

    it('should return false for a file system package path without prefix', () => {
      expect(PackagePath.fromString(fileSystemPathWithoutPrefix).isGitPath).false
    })

    it('should return false for a registry path', () => {
      expect(PackagePath.fromString(registryPath).isGitPath).false
    })

    it('should return true for a git ssh path', () => {
      expect(PackagePath.fromString(gitSshPath).isGitPath).true
    })

    it('should return true for a git ssh path with version', () => {
      expect(PackagePath.fromString(gitSshVersionPath).isGitPath).true
    })

    it('should return true for a git https path', () => {
      expect(PackagePath.fromString(gitHttpsPath).isGitPath).true
    })

    it('should return true for a git https path with version', () => {
      expect(PackagePath.fromString(gitHttpsVersionPath).isGitPath).true
    })
  })

  describe('get isFilePath', () => {
    it('should return true for a file system package path', () => {
      expect(PackagePath.fromString(fileSystemPath).isFilePath).true
    })

    it('should return true for a file system package path without prefix', () => {
      expect(PackagePath.fromString(fileSystemPathWithoutPrefix).isFilePath).true
    })
    
    it('should return false for a registry path', () => {
      expect(PackagePath.fromString(registryPath).isFilePath).false
    })

    it('should return false for a git ssh path', () => {
      expect(PackagePath.fromString(gitSshPath).isFilePath).false
    })

    it('should return false for a git ssh path with version', () => {
      expect(PackagePath.fromString(gitSshVersionPath).isFilePath).false
    })

    it('should return false for a git https path', () => {
      expect(PackagePath.fromString(gitHttpsPath).isFilePath).false
    })

    it('should return false for a git https path with version', () => {
      expect(PackagePath.fromString(gitHttpsVersionPath).isFilePath).false
    })
  })

  describe('get isRegistryPath', () => {
    it('should return true for a registry path', () => {
      expect(PackagePath.fromString(registryPath).isRegistryPath).true
    })

    it('should return true for a registry path with version', () => {
      expect(PackagePath.fromString(registryVersionPath).isRegistryPath).true
    })

    it('should return false for a file system package path', () => {
      expect(PackagePath.fromString(fileSystemPath).isRegistryPath).false
    })

    it('should return false for a file system package path without prefix', () => {
      expect(PackagePath.fromString(fileSystemPathWithoutPrefix).isRegistryPath).false
    })

    it('should return false for a git ssh path', () => {
      expect(PackagePath.fromString(gitSshPath).isRegistryPath).false
    })

    it('should return false for a git ssh path with version', () => {
      expect(PackagePath.fromString(gitSshVersionPath).isRegistryPath).false
    })

    it('should return false for a git https path', () => {
      expect(PackagePath.fromString(gitHttpsPath).isRegistryPath).false
    })

    it('should return false for a git https path with version', () => {
      expect(PackagePath.fromString(gitHttpsVersionPath).isRegistryPath).false
    })
  })
})
import sinon from 'sinon'
import * as coreUtils from '../src/utils'
import log from '../src/log'
import { AppVersionDescriptor } from '../src/descriptors'
import { PackagePath } from '../src/PackagePath'
import { assert, expect } from 'chai'
import { doesThrow } from 'ern-util-dev'
import * as git from '../src/gitCli'

const sandbox = sinon.createSandbox()

let processExitStub: any
let logStub: any

describe('Core Utils', () => {
  beforeEach(() => {
    processExitStub = sandbox.stub(process, 'exit')
    logStub = sandbox.stub(log)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('logErrorAndExitProcess', () => {
    it('test logErrorAndExitProcess', () => {
      coreUtils.logErrorAndExitProcess(new Error('test error'), 1)
      sinon.assert.calledOnce(logStub.error)
      sinon.assert.calledWith(logStub.error, 'An error occurred: test error')
      sinon.assert.calledOnce(processExitStub)
      sinon.assert.calledWith(processExitStub, 1)
    })

    it('test logErrorAndExitProcess with arguments', () => {
      coreUtils.logErrorAndExitProcess(new Error('test error'), 1)
      sinon.assert.calledWith(logStub.error, 'An error occurred: test error')
      sinon.assert.calledWith(processExitStub, 1)
    })
  })

  describe('coerceToAppVersionDescriptor', () => {
    it('should coerce a string to a AppVersionDescriptor', () => {
      expect(coreUtils.coerceToAppVersionDescriptor('test:android:1.0.0')).eql(
        AppVersionDescriptor.fromString('test:android:1.0.0')
      )
    })

    it('should coerce an AppVersionDescriptor to a AppVersionDescriptor (noop)', () => {
      const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0')
      expect(coreUtils.coerceToAppVersionDescriptor(descriptor)).eql(descriptor)
    })
  })

  describe('coerceToAppVersionDescriptorArray', () => {
    it('should coerce a string to a AppVersionDescriptor array', () => {
      const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0')
      const result = coreUtils.coerceToAppVersionDescriptorArray(
        'test:android:1.0.0'
      )
      expect(result)
        .is.an('array')
        .of.length(1)
      expect(result[0]).eql(descriptor)
    })

    it('should coerce a AppVersionDescriptor to a AppVersionDescriptor array', () => {
      const descriptor = AppVersionDescriptor.fromString('test:android:1.0.0')
      const result = coreUtils.coerceToAppVersionDescriptorArray(descriptor)
      expect(result)
        .is.an('array')
        .of.length(1)
      expect(result[0]).eql(descriptor)
    })

    it('should coerce a string|AppVersionDescriptor descriptor mixed array to a AppVersionDescriptor arry', () => {
      const descriptorA = AppVersionDescriptor.fromString('test:android:1.0.0')
      const descriptorB = AppVersionDescriptor.fromString('test:android:2.0.0')
      const result = coreUtils.coerceToAppVersionDescriptorArray([
        'test:android:1.0.0',
        descriptorB,
      ])
      expect(result)
        .is.an('array')
        .of.length(2)
      expect(result[0]).eql(descriptorA)
      expect(result[1]).eql(descriptorB)
    })
  })

  describe('coerceToPackagePath', () => {
    it('should coerce a string to a PackagePath', () => {
      expect(coreUtils.coerceToPackagePath('dep@1.0.0')).eql(
        PackagePath.fromString('dep@1.0.0')
      )
    })

    it('should coerce a PackagePath to a PackagePath (noop)', () => {
      const dep = PackagePath.fromString('dep@1.0.0')
      expect(coreUtils.coerceToPackagePath(dep)).eql(dep)
    })
  })

  describe('coerceToPackagePathArray', () => {
    it('should coerce a string to a PackagePath array', () => {
      const dep = PackagePath.fromString('dep@1.0.0')
      const result = coreUtils.coerceToPackagePathArray('dep@1.0.0')
      expect(result)
        .is.an('array')
        .of.length(1)
      expect(result[0]).eql(dep)
    })

    it('should coerce a PackagePath to a PackagePath array', () => {
      const dep = PackagePath.fromString('dep@1.0.0')
      const result = coreUtils.coerceToPackagePathArray(dep)
      expect(result)
        .is.an('array')
        .of.length(1)
      expect(result[0]).eql(dep)
    })

    it('should coerce a string|PackagePath mixed array to a PackagePath array', () => {
      const depA = PackagePath.fromString('depA@1.0.0')
      const depB = PackagePath.fromString('depB@1.0.0')
      const result = coreUtils.coerceToPackagePathArray(['depA@1.0.0', depB])
      expect(result)
        .is.an('array')
        .of.length(2)
      expect(result[0]).eql(depA)
      expect(result[1]).eql(depB)
    })
  })

  describe('isGitBranch', () => {
    const sampleHeadsRefs = `
31d04959d8786113bfeaee997a1d1eaa8cb6c5f5        refs/heads/master
6319d9ef0c237907c784a8c472b000d5ff83b49a        refs/heads/v0.10
81ac6c5ef280e46a1d643f86f47c66b11aa1f8b4        refs/heads/v0.11`

    it('should return false if the package path is not a git path', async () => {
      const result = await coreUtils.isGitBranch(
        PackagePath.fromString('registry-package@1.2.3')
      )
      expect(result).false
    })

    it('should return true if the package path does not include a branch [as it corresponds to default branch]', async () => {
      const result = await coreUtils.isGitBranch(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git'
        )
      )
      expect(result).true
    })

    it('shoud return true if the branch exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return Promise.resolve(sampleHeadsRefs)
        },
      })
      const result = await coreUtils.isGitBranch(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git#v0.10'
        )
      )
      expect(result).true
    })

    it('shoud return false if the branch does not exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return Promise.resolve(sampleHeadsRefs)
        },
      })
      const result = await coreUtils.isGitBranch(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git#foo'
        )
      )
      expect(result).false
    })
  })

  describe('isGitTag', () => {
    const sampleTagsRefs = `
c4191b97e0f77f8cd128275977e7f284277131e0        refs/tags/v0.1.0
4cc7a6f041ebd9a7f4ec267cdc2e57cf0ddc61fa        refs/tags/v0.1.1
d9fa903349bbb9e7f86535cb69256e064d0fba65        refs/tags/v0.1.2`

    it('should return false if the package path is not a git path', async () => {
      const result = await coreUtils.isGitTag(
        PackagePath.fromString('registry-package@1.2.3')
      )
      expect(result).false
    })

    it('should return false if the package path does not include a tag', async () => {
      const result = await coreUtils.isGitTag(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git'
        )
      )
      expect(result).false
    })

    it('shoud return true if the tag exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return Promise.resolve(sampleTagsRefs)
        },
      })
      const result = await coreUtils.isGitTag(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git#v0.1.2'
        )
      )
      expect(result).true
    })

    it('shoud return false if the tag does not exist', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return Promise.resolve(sampleTagsRefs)
        },
      })
      const result = await coreUtils.isGitBranch(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git#foo'
        )
      )
      expect(result).false
    })
  })

  describe('getCommitShaOfGitBranchOrTag', () => {
    const sampleRef = `31d04959d8786113bfeaee997a1d1eaa8cb6c5f5        refs/heads/master`

    it('should throw if the package path is not a git path', async () => {
      assert(
        await doesThrow(
          coreUtils.getCommitShaOfGitBranchOrTag,
          null,
          PackagePath.fromString('registry-package@1.2.3')
        )
      )
    })

    it('should throw if the package path does not include a branch', async () => {
      assert(
        await doesThrow(
          coreUtils.getCommitShaOfGitBranchOrTag,
          null,
          PackagePath.fromString(
            'https://github.com/electrode-io/electrode-native.git'
          )
        )
      )
    })

    it('should throw if the branch was not found', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return Promise.resolve('')
        },
      })
      assert(
        await doesThrow(
          coreUtils.getCommitShaOfGitBranchOrTag,
          null,
          PackagePath.fromString(
            'https://github.com/electrode-io/electrode-native.git#foo'
          )
        )
      )
    })

    it('should return the commit SHA of the branch HEAD', async () => {
      sandbox.stub(git, 'gitCli').returns({
        listRemote: async () => {
          return Promise.resolve(sampleRef)
        },
      })
      const result = await coreUtils.getCommitShaOfGitBranchOrTag(
        PackagePath.fromString(
          'https://github.com/electrode-io/electrode-native.git#master'
        )
      )
      expect(result).eql('31d04959d8786113bfeaee997a1d1eaa8cb6c5f5')
    })
  })

  describe('areSamePackagePathsAndVersions', () => {
    it('should return false if the packages arrays are not of same length', async () => {
      const a = [PackagePath.fromString('packA@1.2.3')]
      const b = [
        PackagePath.fromString('packA@1.2.3'),
        PackagePath.fromString('packB@1.0.0'),
      ]
      const result = await coreUtils.areSamePackagePathsAndVersions(a, b)
      expect(result).false
    })

    it('should return true if the packages arrays are identical', async () => {
      const a = [
        PackagePath.fromString('packA@1.2.3'),
        PackagePath.fromString('packB@1.0.0'),
      ]
      const b = [
        PackagePath.fromString('packA@1.2.3'),
        PackagePath.fromString('packB@1.0.0'),
      ]
      const result = await coreUtils.areSamePackagePathsAndVersions(a, b)
      expect(result).true
    })

    it('should return true if the packages are pointing to same commit sha [branch]', async () => {
      const a = [
        PackagePath.fromString(
          'https://github.com/electrode-io/MovieListMiniApp.git#334df50afb1c18e5a42058208c5915643a661009'
        ),
      ]
      const b = [
        PackagePath.fromString(
          'https://github.com/electrode-io/MovieListMiniApp.git#ern-v0.24'
        ),
      ]
      const result = await coreUtils.areSamePackagePathsAndVersions(a, b)
      expect(result).true
    }).timeout(5000)

    it('should return false if the packages are not pointing to same commit sha [branch]', async () => {
      const a = [
        PackagePath.fromString(
          'https://github.com/electrode-io/MovieListMiniApp.git#124df50afb3c18e5a42058508c5915663a661008'
        ),
      ]
      const b = [
        PackagePath.fromString(
          'https://github.com/electrode-io/MovieListMiniApp.git#ern-v0.24'
        ),
      ]
      const result = await coreUtils.areSamePackagePathsAndVersions(a, b)
      expect(result).false
    }).timeout(5000)

    it('should return true if the packages are pointing to same commit sha [tag]', async () => {
      const a = [
        PackagePath.fromString(
          'https://github.com/electrode-io/MovieListMiniApp.git#03ecb47c9bcc693d0d6d43a3cace1b22cdd64286'
        ),
      ]
      const b = [
        PackagePath.fromString(
          'https://github.com/electrode-io/MovieListMiniApp.git#v0.0.25'
        ),
      ]
      const result = await coreUtils.areSamePackagePathsAndVersions(a, b)
      expect(result).true
    }).timeout(5000)

    it('should return false if at least one package is not using same version', async () => {
      const a = [
        PackagePath.fromString('packA@1.2.3'),
        PackagePath.fromString('packB@1.0.0'),
      ]
      const b = [
        PackagePath.fromString('packA@2.0.0'),
        PackagePath.fromString('packB@1.0.0'),
      ]
      const result = await coreUtils.areSamePackagePathsAndVersions(a, b)
      expect(result).false
    })
  })
})

import sinon from 'sinon'
import { assert, expect } from 'chai'
import { CauldronHelper } from '../src/CauldronHelper'
import { CauldronConfigLevel } from '../src/types'
import {
  createTmpDir,
  PackagePath,
  utils,
  shell,
  AppVersionDescriptor,
  AppPlatformDescriptor,
  AppNameDescriptor,
} from 'ern-core'
import { doesThrow, doesNotThrow, fixtures } from 'ern-util-dev'
import {
  CauldronApi,
  CauldronCodePushEntry,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api'
import jp from 'jsonpath'
import path from 'path'
import mockFs from 'mock-fs'
import fs from 'fs'
const sandbox = sinon.createSandbox()

const codePushMetadataFixtureOne = {
  appVersion: '17.7',
  deploymentName: 'Production',
  isMandatory: true,
  label: 'v20',
  releaseMethod: 'Upload',
  releasedBy: 'lemaireb@gmail.com',
  rollout: 100,
  size: 522947,
}

const miniAppsFixtureOne = [
  PackagePath.fromString('code-push-test-miniapp@0.0.22'),
]

let documentStore
let fileStore
let fileStoreTmpDir

const fixturesPath = path.join(__dirname, 'fixtures')
const fixtureFileStorePath = path.join(fixturesPath, 'filestore')

function createCauldronApi({
  cauldronDocument,
  storePath,
}: {
  cauldronDocument?: any
  storePath?: string
} = {}) {
  fileStoreTmpDir = createTmpDir()
  // Copy fixture file store to the temporary test file store directory
  shell.cp('-rf', path.join(fixtureFileStorePath, '**'), fileStoreTmpDir)
  documentStore = new InMemoryDocumentStore(cauldronDocument)
  fileStore = new EphemeralFileStore({
    storePath: storePath || fileStoreTmpDir,
  })
  return new CauldronApi(documentStore, fileStore)
}

function createCauldronHelper({
  cauldronDocument,
  storePath,
}: {
  cauldronDocument?: any
  storePath?: string
} = {}) {
  return new CauldronHelper(createCauldronApi({ cauldronDocument, storePath }))
}

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture))
}

const testAndroid1770Path =
  '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
const testAndroid1780Path =
  '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.8.0")]'
const testTopLevelContainerPath =
  '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].containerVersion'

describe('CauldronHelper.js', () => {
  afterEach(() => {
    mockFs.restore()
    sandbox.restore()
  })

  describe('constructor', () => {
    it('should throw if no CauldronApi instance is provided', () => {
      expect(() => new CauldronHelper(undefined!)).to.throw()
    })

    it('should thro if a null CauldronApi instance is provided', () => {
      expect(() => new CauldronHelper(null!)).to.throw()
    })

    it('should not throw if a CauldronApi instance is provided', () => {
      expect(
        () => new CauldronHelper(createCauldronApi({ cauldronDocument: {} }))
      ).to.not.throw()
    })
  })

  describe('isDescriptorInCauldron', () => {
    it('should return true when querying an existing top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.isDescriptorInCauldron(
        AppNameDescriptor.fromString('test')
      )
      expect(result).true
    })

    it('should return false when querying a non existing top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.isDescriptorInCauldron(
        AppNameDescriptor.fromString('foo')
      )
      expect(result).false
    })

    it('should return true when querying an existing top level native app platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.isDescriptorInCauldron(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).true
    })

    it('should return false when querying a non existing top level native app platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.isDescriptorInCauldron(
        AppPlatformDescriptor.fromString('test:ios')
      )
      expect(result).false
    })

    it('should return true when querying an existing top level native app version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.isDescriptorInCauldron(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).true
    })

    it('should return false when querying a non existing top level native app version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.isDescriptorInCauldron(
        AppVersionDescriptor.fromString('test:android:0.0.0')
      )
      expect(result).false
    })
  })

  describe('addMiniAppToContainer', () => {
    it('should add the MiniApp to the container miniApps array [registry path]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addMiniAppToContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('registry-miniapp@1.0.0')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniApps.includes('registry-miniapp@1.0.0')
      ).true
    })

    it('should add the MiniApp to the container miniApps array [git path - no branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      await cauldronHelper.addMiniAppToContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('https://github.com/foo/test-miniapp.git#tag')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniApps.includes(
          'https://github.com/foo/test-miniapp.git#tag'
        )
      ).true
    })

    it('should not add the MiniApp to the container miniAppsBranches array [git path - no branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      await cauldronHelper.addMiniAppToContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('https://github.com/foo/test-miniapp.git#tag')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniAppsBranches.includes(
          'https://github.com/foo/test-miniapp.git#tag'
        )
      ).false
    })

    it('should add the MiniApp to the container miniApps array with proper branch HEAD SHA [git path - branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(true)
      sandbox
        .stub(utils, 'getCommitShaOfGitBranchOrTag')
        .resolves('6319d9ef0c237907c784a8c472b000d5ff83b49a')
      await cauldronHelper.addMiniAppToContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('https://github.com/foo/test-miniapp.git#master')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniApps.includes(
          'https://github.com/foo/test-miniapp.git#6319d9ef0c237907c784a8c472b000d5ff83b49a'
        )
      ).true
    })

    it('should add the MiniApp to the container miniAppsBranches array with proper branch [git path - branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(true)
      sandbox
        .stub(utils, 'getCommitShaOfGitBranchOrTag')
        .resolves('6319d9ef0c237907c784a8c472b000d5ff83b49a')
      await cauldronHelper.addMiniAppToContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('https://github.com/foo/test-miniapp.git#master')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniAppsBranches.includes(
          'https://github.com/foo/test-miniapp.git#master'
        )
      ).true
    })
  })

  describe('updateMiniAppVersionInContainer', () => {
    it('should update the MiniApp version in the container miniApps array [registry path]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateMiniAppVersionInContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('@test/react-native-foo@6.0.0')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniApps.includes(
          '@test/react-native-foo@6.0.0'
        )
      ).true
    })

    it('should update the MiniApp version in the container miniApps array [git path - no branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      await cauldronHelper.updateMiniAppVersionInContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString(
          'git+ssh://git@github.com:electrode-io/gitMiniApp.git#0.0.10'
        )
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniApps.includes(
          'git+ssh://git@github.com:electrode-io/gitMiniApp.git#0.0.10'
        )
      ).true
    })

    it('should update the MiniApp in the container miniApps array with proper branch HEAD SHA [git path - branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(true)
      sandbox
        .stub(utils, 'getCommitShaOfGitBranchOrTag')
        .resolves('6319d9ef0c237907c784a8c472b000d5ff83b49a')
      await cauldronHelper.updateMiniAppVersionInContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString(
          'git+ssh://git@github.com:electrode-io/gitMiniApp.git#master'
        )
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniApps.includes(
          'git+ssh://git@github.com:electrode-io/gitMiniApp.git#6319d9ef0c237907c784a8c472b000d5ff83b49a'
        )
      ).true
    })

    it('should update the MiniApp in the container miniAppsBranches array with proper branch [git path - branch]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(true)
      sandbox
        .stub(utils, 'getCommitShaOfGitBranchOrTag')
        .resolves('6319d9ef0c237907c784a8c472b000d5ff83b49a')
      await cauldronHelper.updateMiniAppVersionInContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString(
          'git+ssh://git@github.com:electrode-io/gitMiniApp.git#master'
        )
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.miniAppsBranches.includes(
          'git+ssh://git@github.com:electrode-io/gitMiniApp.git#master'
        )
      ).true
    })
  })

  describe('addJsApiImplToContainer', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addJsApiImplToContainer,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          PackagePath.fromString('test@1.0.0')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addJsApiImplToContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          PackagePath.fromString('test@1.0.0')
        )
      )
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addJsApiImplToContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('test@1.0.0')
        )
      )
    })

    it('should add the JS API impl to the native application version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addJsApiImplToContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('test@1.0.0')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.container.jsApiImpls.includes('test@1.0.0')).true
    })
  })

  describe('removeMiniAppFromContainer', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeMiniAppFromContainer,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          PackagePath.fromString('@test/react-native-foo@5.0.0')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeMiniAppFromContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          PackagePath.fromString('@test/react-native-foo@5.0.0')
        )
      )
    })

    it('should throw if the given native application version is released', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeMiniAppFromContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('@test/react-native-foo@5.0.0')
        )
      )
    })

    it('should remove the miniapp from the native application version [1]', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.removeMiniAppFromContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('@test/react-native-foo@5.0.0')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.nativeDeps.includes(
          '@test/react-native-foo@5.0.0'
        )
      ).false
    })

    it('should remove the miniapp from the native application version [2]', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.removeMiniAppFromContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('@test/react-native-foo')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.nativeDeps.includes(
          '@test/react-native-foo@5.0.0'
        )
      ).false
    })
  })

  describe('removeJsApiImplFromContainer', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeJsApiImplFromContainer,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          PackagePath.fromString('react-native-my-api-impl@1.0.0')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeJsApiImplFromContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          PackagePath.fromString('react-native-my-api-impl@1.0.0')
        )
      )
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeJsApiImplFromContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-my-api-impl@1.0.0')
        )
      )
    })

    it('should remove the miniapp from the native application version [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.removeJsApiImplFromContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('react-native-my-api-impl@1.0.0')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.nativeDeps.includes(
          'react-native-my-api-impl@1.0.0'
        )
      ).false
    })

    it('should remove the miniapp from the native application version [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.removeJsApiImplFromContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('react-native-my-api-impl')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(
        nativeAppVersion.container.nativeDeps.includes(
          'react-native-my-api-impl@1.0.0'
        )
      ).false
    })
  })

  describe('getDescriptor', () => {
    it('should throw if no top level application is found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getDescriptor,
          cauldronHelper,
          AppNameDescriptor.fromString('foo')
        )
      )
    })

    it('should return a top level native app', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getDescriptor(
        AppNameDescriptor.fromString('test')
      )
      expect(result).to.be.an('object')
      expect(result.name).eql('test')
    })

    it('should throw if no application platform is found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getDescriptor,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:ios')
        )
      )
    })

    it('should return a native app platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getDescriptor(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).to.be.an('object')
      expect(result.name).eql('android')
    })

    it('should throw if no application version is found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getDescriptor,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0')
        )
      )
    })

    it('should return a native app version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getDescriptor(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).to.be.an('object')
      expect(result.name).eql('17.7.0')
    })
  })

  describe('getVersions', () => {
    it('should throw if the descriptor does not contain a platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getVersions,
          cauldronHelper,
          AppNameDescriptor.fromString('test')
        )
      )
    })

    it('should return all the versions', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getVersions(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
    })
  })

  describe('getVersionsNames', () => {
    it('should return all version names', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getVersionsNames(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
      expect(result[0]).eql('17.7.0')
      expect(result[1]).eql('17.8.0')
    })
  })

  describe('getNativeAppsForPlatform', () => {
    it('should return the native applications for android platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNativeAppsForPlatform('android')
      expect(result).eql(['test'])
    })

    it('should return the native applications for ios platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNativeAppsForPlatform('ios')
      expect(result).eql([])
    })
  })

  describe('getNativeDependencies', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getNativeDependencies,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android')
        )
      )
    })

    it('should return the native dependencies', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNativeDependencies(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(4)
    })
  })

  describe('hasYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.hasYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.hasYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should return true if the yarn lock exists', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.hasYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(result).true
    })

    it('should return true if the yarn lock does not exists', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.hasYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      expect(result).false
    })
  })

  describe('addYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should add the yarn lock', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Foo')
    })
  })

  describe('getYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should return undefined if the yarn lock is not found for key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const yarnLock = await cauldronHelper.getYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      expect(yarnLock).undefined
    })

    it('should return the yarn lock if found for key', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      const yarnLock = await cauldronHelper.getYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      expect(yarnLock).not.undefined
      expect((<Buffer>yarnLock).toString()).eql('yarnLockContent')
    })
  })

  describe('getPathToYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getPathToYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getPathToYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should return undefined if there is no yarn lock for the key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getPathToYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      expect(result).undefined
    })

    it('should return the path to the yarn lock', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      const result = await cauldronHelper.getPathToYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      expect(result).to.be.a('string')
    })
  })

  describe('removeYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.removeYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should remove the yarn lock', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      await cauldronHelper.removeYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.not.have.property('Foo')
    })
  })

  describe('updateYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production',
          '/path/to/yarn.lock'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production',
          '/path/to/yarn.lock'
        )
      )
    })

    it('should update the yarn lock', async () => {
      mockFs({
        '/path/to/new/yarn.lock': 'updatedYarnLockContent',
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      await cauldronHelper.updateYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/new/yarn.lock'
      )
      const yarnLock = await cauldronHelper.getYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo'
      )
      expect(yarnLock).not.undefined
      expect((<Buffer>yarnLock).toString()).eql('updatedYarnLockContent')
    })

    it('should return true if yarn lock was updated', async () => {
      mockFs({
        '/path/to/new/yarn.lock': 'updatedYarnLockContent',
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      const result = await cauldronHelper.updateYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/new/yarn.lock'
      )
      expect(result).true
    })

    it('should return false if yarn lock was not updated', async () => {
      mockFs({
        '/path/to/new/yarn.lock': 'updatedYarnLockContent',
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.updateYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/new/yarn.lock'
      )
      expect(result).false
    })
  })

  describe('setYarnLocks', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.setYarnLocks,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          {
            Bar: 'a0112c49-4bbc-47a9-ba45-d43e1e84a1a5',
            Foo: 'b0112c49-4bbc-47a9-ba45-d43e1e84a1a5',
          }
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.setYarnLocks,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          {
            Bar: 'a0112c49-4bbc-47a9-ba45-d43e1e84a1a5',
            Foo: 'b0112c49-4bbc-47a9-ba45-d43e1e84a1a5',
          }
        )
      )
    })

    it('should set the yarn locks', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.setYarnLocks(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        {
          Bar: 'a0112c49-4bbc-47a9-ba45-d43e1e84a1a5',
          Foo: 'b0112c49-4bbc-47a9-ba45-d43e1e84a1a5',
        }
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks)
        .to.have.property('Foo')
        .eql('b0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
      expect(nativeAppVersion.yarnLocks)
        .to.have.property('Bar')
        .eql('a0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
    })
  })

  describe('addOrUpdateYarnLock', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addOrUpdateYarnLock,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production',
          '/path/to/yarn.lock'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addOrUpdateYarnLock,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production',
          '/path/to/yarn.lock'
        )
      )
    })

    it('should add the yarn lock if it does not exist yet', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        '/path/to/yarn.lock'
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks).to.have.property('Foo')
    })

    it('should update the yarn lock if exists', async () => {
      mockFs({
        '/path/to/yarn.lock': 'yarnLockContent',
      })
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
        '/path/to/yarn.lock'
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks)
        .to.have.property('Production')
        .not.eql('a0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
    })
  })

  describe('getYarnLockId', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getYarnLockId,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getYarnLockId,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should return if the yarn lock id', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(result).eql('a0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
    })
  })

  describe('setYarnLockId', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.setYarnLockId,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Foo',
          'c0112c49-4bbc-47a9-ba45-d43e1e84a1a5'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.setYarnLockId,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Foo',
          'c0112c49-4bbc-47a9-ba45-d43e1e84a1a5'
        )
      )
    })

    it('should set the yarn lock id', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.setYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Foo',
        'c0112c49-4bbc-47a9-ba45-d43e1e84a1a5'
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks)
        .to.have.property('Foo')
        .eql('c0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
    })
  })

  describe('updateYarnLockId', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateYarnLockId,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production',
          'c0112c49-4bbc-47a9-ba45-d43e1e84a1a5'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateYarnLockId,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production',
          'c0112c49-4bbc-47a9-ba45-d43e1e84a1a5'
        )
      )
    })

    it('should upddate the yarn lock id', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
        'c0112c49-4bbc-47a9-ba45-d43e1e84a1a5'
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeAppVersion.yarnLocks)
        .to.have.property('Production')
        .eql('c0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
    })
  })

  describe('addFile', () => {
    it('should add the file to the cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
        localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
      })
      const hasAddedFile = await fileStore.hasFile(
        'path/in/cauldron/testfile.ext'
      )
      expect(hasAddedFile).true
    })
  })

  describe('updateFile', () => {
    it('should throw if the file was not added first', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(cauldronHelper.updateFile, cauldronHelper, {
          cauldronFilePath: 'path/in/cauldron/testfile.ext',
          localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
        })
      )
    })

    it('should update the file in the cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
        localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
      })
      await cauldronHelper.updateFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
        localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
      })
      const hasAddedFile = await fileStore.hasFile(
        'path/in/cauldron/testfile.ext'
      )
      expect(hasAddedFile).true
    })
  })

  describe('removeFile', () => {
    it('should throw if the file was not added first', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(cauldronHelper.removeFile, cauldronHelper, {
          cauldronFilePath: 'path/in/cauldron/testfile.ext',
          localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
        })
      )
    })

    it('should remove the file from the cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
        localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
      })
      await cauldronHelper.removeFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
      })
      const hasFile = await fileStore.hasFile('path/in/cauldron/testfile.ext')
      expect(hasFile).false
    })
  })

  describe('hasFile', () => {
    it('should return false if the file does not exist in cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const hasFile = await cauldronHelper.hasFile({
        cauldronFilePath: '/non/existing/file',
      })
      expect(hasFile).false
    })

    it('should return true if the file does exist in cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
        localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
      })
      const hasFile = await cauldronHelper.hasFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
      })
      expect(hasFile).true
    })
  })

  describe('getFile', () => {
    it('should throw if the file does not exist in cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(cauldronHelper.getFile, cauldronHelper, {
          cauldronFilePath: '/non/existing/file',
        })
      )
    })

    it('should return the file content if the file does exist in cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
        localFilePath: path.resolve(__dirname, 'fixtures/testfile.ext'),
      })
      const fileContent = await cauldronHelper.getFile({
        cauldronFilePath: 'path/in/cauldron/testfile.ext',
      })
      expect(fileContent.toString()).eql('dummyfile')
    })
  })

  describe('addBundle', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addBundle,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'bundleContent'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addBundle,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'bundleContent'
        )
      )
    })

    it('should add the bundle', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'bundleContent'
      )
      const bundledAdded = await fileStore.hasFile(
        path.join('bundles/test-android-17.7.0.zip')
      )
      expect(bundledAdded).true
    })
  })

  describe('hasBundle', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.hasBundle,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android')
        )
      )
    })

    it('should return true if there is a stored bundle for the given native application descriptor', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT'
      )
      const hasBundle = await cauldronHelper.hasBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(hasBundle).true
    })

    it('should return false if there is no stored bundle for the given native application descriptor', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const hasBundle = await cauldronHelper.hasBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(hasBundle).false
    })
  })

  describe('getBundle', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getBundle,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android')
        )
      )
    })

    it('should throw if there is no stored bundle for the given native application descriptor', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getBundle,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0')
        )
      )
    })

    it('should return the stored bundle for the given native application descriptor', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.addBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT'
      )
      const bundle = await cauldronHelper.getBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(bundle.toString()).eql('BUNDLE_CONTENT')
    })
  })

  describe('getContainerNativeDependency', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerNativeDependency,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'react-native-electrode-bridge'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerNativeDependency,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'react-native-electrode-bridge'
        )
      )
    })

    it('should throw if the dependency was not found [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerNativeDependency,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'foo'
        )
      )
    })

    it('should throw if the dependency was not found [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerNativeDependency,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'react-native-electrode-bridge@0.0.1'
        )
      )
    })

    it('should return the dependency [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerNativeDependency(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-electrode-bridge'
      )
      expect(result).not.undefined
      expect(result.basePath).eql('react-native-electrode-bridge')
    })

    it('should return the dependency [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerNativeDependency(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-electrode-bridge@1.4.9'
      )
      expect(result).not.undefined
      expect(result.basePath).eql('react-native-electrode-bridge')
    })
  })
  describe('syncContainerMiniApps', () => {
    it('should not update anything if miniapps versions are the same', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.syncContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        [
          PackagePath.fromString('@test/react-native-foo@5.0.0'),
          PackagePath.fromString('react-native-bar@3.0.0'),
          PackagePath.fromString(
            'git+ssh://git@github.com:electrode-io/gitMiniApp.git#0.0.9'
          ),
        ]
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.container.miniApps).length(4)
      expect(nativeAppVersion.container.miniApps).includes(
        '@test/react-native-foo@5.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'react-native-bar@3.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'git+ssh://git@github.com:electrode-io/gitMiniApp.git#0.0.9'
      )
    })

    it('should add missing miniapps', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.syncContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        [
          PackagePath.fromString('@test/react-native-foo@5.0.0'),
          PackagePath.fromString('react-native-bar@3.0.0'),
          PackagePath.fromString(
            'git+ssh://git@github.com:electrode-io/gitMiniApp.git#0.0.9'
          ),
          PackagePath.fromString('new-miniapp@0.0.1'),
        ]
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.container.miniApps).length(5)
      expect(nativeAppVersion.container.miniApps).includes(
        '@test/react-native-foo@5.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'react-native-bar@3.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'git+ssh://git@github.com:electrode-io/gitMiniApp.git#0.0.9'
      )
      expect(nativeAppVersion.container.miniApps).includes('new-miniapp@0.0.1')
    })

    it('should update miniapps with different versions', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      await cauldronHelper.syncContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        [
          PackagePath.fromString('@test/react-native-foo@6.0.0'),
          PackagePath.fromString('react-native-bar@3.0.0'),
          PackagePath.fromString(
            'git+ssh://git@github.com:electrode-io/gitMiniApp.git#1.0.0'
          ),
        ]
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.container.miniApps).length(4)
      expect(nativeAppVersion.container.miniApps).includes(
        '@test/react-native-foo@6.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'react-native-bar@3.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'git+ssh://git@github.com:electrode-io/gitMiniApp.git#1.0.0'
      )
    })

    it('should add missing miniapps and update miniapps with different versions', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      sandbox.stub(utils, 'isGitBranch').resolves(false)
      await cauldronHelper.syncContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        [
          PackagePath.fromString('@test/react-native-foo@6.0.0'),
          PackagePath.fromString('react-native-bar@3.0.0'),
          PackagePath.fromString(
            'git+ssh://git@github.com:electrode-io/gitMiniApp.git#1.0.0'
          ),
          PackagePath.fromString('new-miniapp@0.0.1'),
        ]
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.container.miniApps).length(5)
      expect(nativeAppVersion.container.miniApps).includes(
        '@test/react-native-foo@6.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'react-native-bar@3.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes(
        'git+ssh://git@github.com:electrode-io/gitMiniApp.git#1.0.0'
      )
      expect(nativeAppVersion.container.miniApps).includes('new-miniapp@0.0.1')
    })
  })

  describe('updateJsApiImplVersionInContainer', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateJsApiImplVersionInContainer,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          PackagePath.fromString('react-native-my-api-impl@1.5.0')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateJsApiImplVersionInContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          PackagePath.fromString('react-native-my-api-impl@1.5.0')
        )
      )
    })

    it('should throw if the given native application version is released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateJsApiImplVersionInContainer,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-my-api-impl@1.5.0')
        )
      )
    })

    it('should update the native dependency version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateJsApiImplVersionInContainer(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        PackagePath.fromString('react-native-my-api-impl@1.5.0')
      )
      const nativeAppVersion = jp.query(fixture, testAndroid1780Path)[0]
      expect(nativeAppVersion.container.jsApiImpls).includes(
        'react-native-my-api-impl@1.5.0'
      )
      expect(nativeAppVersion.container.jsApiImpls).not.includes(
        'react-native-my-api-impl@1.1.0'
      )
    })
  })

  describe('getAllNativeApps', () => {
    it('should return all native applications', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getAllNativeApps()
      expect(result)
        .to.be.an('array')
        .of.length(1)
    })
  })

  describe('getContainerJsApiImpls', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerJsApiImpls,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerJsApiImpls,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0')
        )
      )
    })

    it('should return the container MiniApps', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
    })
  })

  describe('syncContainerJsApiImpls', () => {
    it('should update the versions of existing js api implementations', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.syncContainerJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        [PackagePath.fromString('react-native-my-api-impl@1.0.1')]
      )
      const result = await cauldronHelper.getContainerJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
      expect(result[0].version).eql('1.0.1')
    })

    it('should add new js api implementations', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.syncContainerJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        [PackagePath.fromString('new-js-api-impl@1.0.0')]
      )
      const result = await cauldronHelper.getContainerJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
    })
  })

  describe('getContainerErnVersion', () => {
    it('should return the ern version of the target container', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerErnVersion(
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result).eql('1000.0.0')
    })
  })

  describe('getCauldronConfigLevelMatchingDescriptor', () => {
    it('should return CauldronConfigLevel.Top if descriptor is undefined', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = cauldronHelper.getCauldronConfigLevelMatchingDescriptor(
        undefined
      )
      expect(result).eql(CauldronConfigLevel.Top)
    })

    it('should return CauldronConfigLevel.NativeAppVersion if descriptor target a native application version', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = cauldronHelper.getCauldronConfigLevelMatchingDescriptor(
        AppVersionDescriptor.fromString('test:android:1.0.0')
      )
      expect(result).eql(CauldronConfigLevel.NativeAppVersion)
    })

    it('should return CauldronConfigLevel.NativeAppPlatform if descriptor target a native application platform', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = cauldronHelper.getCauldronConfigLevelMatchingDescriptor(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).eql(CauldronConfigLevel.NativeAppPlatform)
    })

    it('should return CauldronConfigLevel.NativeApp if descriptor target a native application', () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = cauldronHelper.getCauldronConfigLevelMatchingDescriptor(
        AppNameDescriptor.fromString('test')
      )
      expect(result).eql(CauldronConfigLevel.NativeApp)
    })
  })

  describe('getContainerJsApiImpl', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerJsApiImpl,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          PackagePath.fromString('react-native-my-api-impl')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerJsApiImpl,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          PackagePath.fromString('react-native-my-api-impl')
        )
      )
    })

    it('should throw if the JS API impl was not found', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerJsApiImpl,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('foo@1.0.0')
        )
      )
    })

    it('should return the JS API impl [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerJsApiImpl(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl')
      )
      expect(result).not.undefined
    })

    it('should return the JS API impl [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerJsApiImpl(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@1.0.0')
      )
      expect(result).not.undefined
    })
  })

  describe('getContainerMiniApp', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerMiniApp,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'react-native-bar'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerMiniApp,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'react-native-bar'
        )
      )
    })

    it('should throw if the MiniApp was not found [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerMiniApp,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'foo@1.0.0'
        )
      )
    })

    it('should throw if the MiniApp was not found [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerMiniApp,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'react-native-bar@0.0.1'
        )
      )
    })

    it('should return the MiniApp [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerMiniApp(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-bar'
      )
      expect(result).not.undefined
    })

    it('should return the MiniApp [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerMiniApp(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-bar@2.0.0'
      )
      expect(result).not.undefined
    })
  })

  describe('getCodePushJsApiImpls', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getCodePushJsApiImpls,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getCodePushJsApiImpls,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should throw if deployment does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getCodePushJsApiImpls,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'Foo'
        )
      )
    })

    it('should return the CodePushed JS API impls', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getCodePushJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
    })
  })

  describe('getCodePushEntry', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        await doesThrow(
          cauldronHelper.getCodePushEntry,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        await doesThrow(
          cauldronHelper.getCodePushEntry,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should throw if the label does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        await doesThrow(
          cauldronHelper.getCodePushEntry,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'Production',
          { label: 'v0' }
        )
      )
    })

    it('should return the latest CodePushed entry if label is ommited', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(result).not.undefined
      expect((<CauldronCodePushEntry>result).metadata.label).eql('v17')
    })

    it('should return the CodePushed entry matching label', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
        { label: 'v16' }
      )
      expect(result).not.undefined
      expect((<CauldronCodePushEntry>result).metadata.label).eql('v16')
    })
  })

  describe('getCodePushMiniApps', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getCodePushMiniApps,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getCodePushMiniApps,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production'
        )
      )
    })

    it('should throw if deployment does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getCodePushMiniApps,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'Foo'
        )
      )
    })

    it('should return the latest CodePushed MiniApps if label is ommited', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getCodePushMiniApps(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
    })

    it('should return the CodePushed MiniApps matching label', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getCodePushMiniApps(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
        { label: 'v16' }
      )
      expect(result)
        .to.be.an('array')
        .of.length(3)
    })

    it('should throw if the label does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        await doesThrow(
          cauldronHelper.getCodePushMiniApps,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'Production',
          { label: 'v0' }
        )
      )
    })
  })

  describe('getContainerMiniApps', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerMiniApps,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerMiniApps,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0')
        )
      )
    })

    it('should return the container MiniApps', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
    })

    it('should return the container MiniApps not favoring git branches by default', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(4)
    })

    it('should not favor container MiniApps git branches by default', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(4)
      expect(result.map(m => m.toString())).contains(
        'https://github.com/foo/foo.git#6319d9ef0c237907c784a8c472b000d5ff83b49a'
      )
    })

    it('should favor container MiniApps git branches if favorGitBranches flag is set', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        { favorGitBranches: true }
      )
      expect(result)
        .to.be.an('array')
        .of.length(4)
      expect(result.map(m => m.toString())).contains(
        'https://github.com/foo/foo.git#master'
      )
    })
  })

  describe('addCodePushEntry', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addCodePushEntry,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          codePushMetadataFixtureOne,
          miniAppsFixtureOne
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.addCodePushEntry,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          codePushMetadataFixtureOne,
          miniAppsFixtureOne
        )
      )
    })
  })

  describe('updateCodePushEntry', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateCodePushEntry,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          'Production',
          'v17',
          {
            isDisabled: true,
          }
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateCodePushEntry,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          'Production',
          'v17',
          {
            isDisabled: true,
          }
        )
      )
    })

    it('should update the code push entry isDisabled property', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        {
          deploymentName: 'Production',
          isDisabled: true,
          label: 'v17',
        }
      )
      const codePushEntries = jp.query(
        fixture,
        `${testAndroid1770Path}.codePush.Production`
      )[0]
      expect(codePushEntries)
        .to.be.an('array')
        .of.length(2)
      const updatedEntry = jp.query(
        codePushEntries,
        `$[?(@.metadata.label=="v17")]`
      )[0]

      expect(updatedEntry.metadata)
        .to.have.property('isDisabled')
        .eql(true)
    })

    it('should update the code push entry isMandatory property', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        {
          deploymentName: 'Production',
          isMandatory: true,
          label: 'v17',
        }
      )
      const codePushEntries = jp.query(
        fixture,
        `${testAndroid1770Path}.codePush.Production`
      )[0]
      expect(codePushEntries)
        .to.be.an('array')
        .of.length(2)
      const updatedEntry = jp.query(
        codePushEntries,
        `$[?(@.metadata.label=="v17")]`
      )[0]

      expect(updatedEntry.metadata)
        .to.have.property('isMandatory')
        .eql(true)
    })

    it('should update the code push entry rollout property', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        {
          deploymentName: 'Production',
          label: 'v17',
          rollout: 10,
        }
      )
      const codePushEntries = jp.query(
        fixture,
        `${testAndroid1770Path}.codePush.Production`
      )[0]
      expect(codePushEntries)
        .to.be.an('array')
        .of.length(2)
      const updatedEntry = jp.query(
        codePushEntries,
        `$[?(@.metadata.label=="v17")]`
      )[0]

      expect(updatedEntry.metadata)
        .to.have.property('rollout')
        .eql(10)
    })
  })

  describe('getContainerGeneratorConfig', () => {
    it('should return the container generator config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerGeneratorConfig(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).not.undefined
    })

    it('should throw if the native application does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerGeneratorConfig,
          cauldronHelper,
          AppPlatformDescriptor.fromString('toto:android')
        )
      )
    })
  })

  describe('getManifestConfig', () => {
    it('should return the manifest config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getManifestConfig()
      expect(result).not.undefined
    })
  })

  describe('getBinaryStoreConfig', () => {
    it('should return the binary store config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getBinaryStoreConfig()
      expect(result).not.undefined
    })
  })

  describe('getCodePushConfig', () => {
    it('should return the code push config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getCodePushConfig(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).not.undefined
    })
  })

  describe('getConfig', () => {
    it('should return the native application version config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfig(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).not.undefined
      expect(result).to.have.property('test')
    })

    it('should return the native application platform config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfig(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).not.undefined
      expect(result).to.have.property('containerGenerator')
    })
  })

  describe('getConfigStrict', () => {
    it('should return the native application version config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigStrict(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).not.undefined
      expect(result).to.have.property('test')
    })

    it('should return the native application platform config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigStrict(
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).not.undefined
      expect(result).to.have.property('containerGenerator')
    })
  })

  describe('getConfigForKey', () => {
    it('should return the native application version config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigForKey(
        'test',
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).not.undefined
    })

    it('should return the native application platform config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigForKey(
        'containerGenerator',
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).not.undefined
    })

    it('should return parent config key if no native app version config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigForKey(
        'test',
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result).not.undefined
      expect(result).equal('aValue')
    })
  })

  describe('getConfigForKeyStrict', () => {
    it('should return the native application version config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigForKeyStrict(
        'test',
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).not.undefined
    })

    it('should return the native application platform config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigForKeyStrict(
        'containerGenerator',
        AppPlatformDescriptor.fromString('test:android')
      )
      expect(result).not.undefined
    })

    it('should not return parent config key if no native app version config key', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: fixtureFileStorePath,
      })
      const result = await cauldronHelper.getConfigForKeyStrict(
        'test',
        AppVersionDescriptor.fromString('test:android:17.8.0')
      )
      expect(result).undefined
    })
  })

  describe('updateNativeAppIsReleased', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateNativeAppIsReleased,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          false
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateNativeAppIsReleased,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          false
        )
      )
    })

    it('should update the native application version release status', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateNativeAppIsReleased(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        false
      )
      const nativeApplicationVersion = jp.query(fixture, testAndroid1770Path)[0]
      expect(nativeApplicationVersion.isReleased).false
    })
  })

  describe('updateContainerVersion', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateContainerVersion,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android'),
          '999.0.0'
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.updateContainerVersion,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0'),
          '999.0.0'
        )
      )
    })

    it('should update the top level container version and native app container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        '999.0.0'
      )
      const nativeApplicationContainerVersion = jp.query(
        fixture,
        testAndroid1770Path
      )[0]
      const topLevelContainerVersion = jp.query(
        fixture,
        testTopLevelContainerPath
      )
      expect(nativeApplicationContainerVersion.containerVersion).eql('999.0.0')
      expect(topLevelContainerVersion[0]).eql('999.0.0')
    })

    it('should update native app container version only[topLevelContainerVersion is gt nativeApplicationVersion]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      await cauldronHelper.updateContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        '1.0.0'
      )
      const nativeApplicationVersion = jp.query(fixture, testAndroid1770Path)[0]
      const topLevelContainerVersion = jp.query(
        fixture,
        testTopLevelContainerPath
      )
      expect(nativeApplicationVersion.containerVersion).eql('1.0.0')
      expect(topLevelContainerVersion[0]).eql('1.16.44')
    })

    it('should update native app container version only[detachContainerVersionFromRoot=true for target descriptor]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const storeTmpDir = createTmpDir()
      shell.mkdir('-p', path.join(storeTmpDir, 'config'))
      fs.writeFileSync(
        path.join(storeTmpDir, 'config/test-android-17.7.0.json'),
        JSON.stringify({ detachContainerVersionFromRoot: true })
      )
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
        storePath: storeTmpDir,
      })

      await cauldronHelper.updateContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        '1000.0.0'
      )
      const nativeApplicationVersion = jp.query(fixture, testAndroid1770Path)[0]
      const topLevelContainerVersion = jp.query(
        fixture,
        testTopLevelContainerPath
      )
      expect(nativeApplicationVersion.containerVersion).eql('1000.0.0')
      expect(topLevelContainerVersion[0]).eql('1.16.44')
    })
  })

  describe('getContainerVersion', () => {
    it('should throw if the given native application descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerVersion,
          cauldronHelper,
          AppPlatformDescriptor.fromString('test:android')
        )
      )
    })

    it('should throw if the given native application descriptor is not in Cauldron', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.getContainerVersion,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:0.0.0')
        )
      )
    })

    it('should return the container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).equal('1.16.44')
    })
  })

  describe('getTopLevelContainerVersion', () => {
    it('should return the top level container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getTopLevelContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).equal('1.16.44')
    })
  })

  describe('throwIfNativeAppVersionIsReleased', () => {
    it('should throw if the native application version is release', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesThrow(
          cauldronHelper.throwIfNativeAppVersionIsReleased,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.7.0'),
          'released'
        )
      )
    })

    it('should not throw if the native application version is not released', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      assert(
        doesNotThrow(
          cauldronHelper.throwIfNativeAppVersionIsReleased,
          cauldronHelper,
          AppVersionDescriptor.fromString('test:android:17.8.0'),
          'nonreleased'
        )
      )
    })
  })

  // ==========================================================
  // getNapDescriptorStrings
  // ==========================================================
  describe('getNapDescriptorStrings', () => {
    it('should return an empty array if no match', async () => {
      const fixture = cloneFixture(fixtures.emptyCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return all native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings()
      expect(result).to.have.lengthOf(2)
    })

    it('should return only released native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings({
        onlyReleasedVersions: true,
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only non released native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings({
        onlyNonReleasedVersions: true,
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only android platform native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings({
        platform: 'android',
      })
      expect(result).to.have.lengthOf(2)
    })

    it('should return only ios platform native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings({
        platform: 'ios',
      })
      expect(result).to.have.lengthOf(0)
    })

    it('should return only android platform released native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings({
        onlyReleasedVersions: true,
        platform: 'android',
      })
      expect(result).to.have.lengthOf(1)
      expect(result[0]).eql('test:android:17.7.0')
    })

    it('should return only android platform non released native apps descriptors', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const result = await cauldronHelper.getNapDescriptorStrings({
        onlyNonReleasedVersions: true,
        platform: 'android',
      })
      expect(result).to.have.lengthOf(1)
      expect(result[0]).eql('test:android:17.8.0')
    })
  })

  // ==========================================================
  // getDescriptorsMatchingSemVerDescriptor
  // ==========================================================
  describe('getDescriptorsMatchingSemVerDescriptor', () => {
    it('should throw if the descriptor does not contain a platform', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppNameDescriptor.fromString('test')
      assert(
        await doesThrow(
          cauldronHelper.getDescriptorsMatchingSemVerDescriptor,
          null,
          descriptor
        )
      )
    })

    it('should throw if the descriptor does not contain a version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppPlatformDescriptor.fromString('test:android')
      assert(
        await doesThrow(
          cauldronHelper.getDescriptorsMatchingSemVerDescriptor,
          null,
          descriptor
        )
      )
    })

    it('should return an empty array if the semver descriptor does not match any version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:5.0.0')
      const result = await cauldronHelper.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result).to.be.an('array').empty
    })

    it('should return the right matched versions [1]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:^17.0.0')
      const result = await cauldronHelper.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
    })

    it('should return the right matched versions [2]', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:17.7.x')
      const result = await cauldronHelper.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
    })
  })

  describe('addNativeApplicationVersion', () => {
    it('should throw if the descriptor is partial', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppPlatformDescriptor.fromString('test:android')
      assert(
        await doesThrow(
          cauldronHelper.addNativeApplicationVersion,
          null,
          descriptor
        )
      )
    })

    it('should throw if the native application version already exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:17.7.0')
      assert(
        await doesThrow(
          cauldronHelper.addNativeApplicationVersion,
          null,
          descriptor
        )
      )
    })

    it('should add the native application version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:20.0.0')
      await cauldronHelper.addNativeApplicationVersion(descriptor)
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      expect(jp.query(fixture, testAndroid2000Path)).not.empty
    })

    it('should properly copy from the latest version if copyFromVersion is set to `latest`', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:20.0.0')
      await cauldronHelper.addNativeApplicationVersion(descriptor, {
        copyFromVersion: 'latest',
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1780 = jp.query(fixture, testAndroid1780Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.container).deep.equal(version1780.container)
    })

    it('should properly copy from a given existing version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppVersionDescriptor.fromString('test:android:20.0.0')
      await cauldronHelper.addNativeApplicationVersion(descriptor, {
        copyFromVersion: '17.7.0',
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.container).deep.equal(version1770.container)
    })
  })

  describe('copyNativeApplicationVersion', () => {
    it('should throw if source native application version does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:5.0.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      assert(
        await doesThrow(
          cauldronHelper.copyNativeApplicationVersion,
          null,
          sourceDescriptor,
          targetDescriptor
        )
      )
    })

    it('should throw if target native application version does not exist', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      assert(
        await doesThrow(
          cauldronHelper.copyNativeApplicationVersion,
          null,
          sourceDescriptor,
          targetDescriptor
        )
      )
    })

    it('should copy the container dependencies', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.container.nativeDeps).deep.equal(
        version1770.container.nativeDeps
      )
    })

    it('should copy the container miniapps', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.container.miniApps).deep.equal(
        version1770.container.miniApps
      )
    })

    it('should copy the container js api implementations', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.container.jsApiImpls).deep.equal(
        version1770.container.jsApiImpls
      )
    })

    it('should copy the yarn locks', async () => {
      const tmp = fileStoreTmpDir
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(Object.keys(version2000.yarnLocks)).deep.equal(
        Object.keys(version1770.yarnLocks)
      )
    })

    it('should copy the config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
      })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        shouldCopyConfig: true,
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const pathToSourceConfig = path.join(
        fileStoreTmpDir,
        'config/test-android-17.7.0.json'
      )
      const pathToTargetConfig = path.join(
        fileStoreTmpDir,
        'config/test-android-20.0.0.json'
      )
      const hasCreatedConfig = fs.existsSync(pathToTargetConfig)
      expect(hasCreatedConfig).true
      const sourceConfig = JSON.parse(
        fs.readFileSync(pathToSourceConfig).toString()
      )
      const targetConfig = JSON.parse(
        fs.readFileSync(pathToTargetConfig).toString()
      )
      expect(targetConfig).deep.equal(sourceConfig)
    })

    it('should not copy the config', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({
        cauldronDocument: fixture,
      })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        shouldCopyConfig: false,
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const pathToSourceConfig = path.join(
        fileStoreTmpDir,
        'config/test-android-17.7.0.json'
      )
      const pathToTargetConfig = path.join(
        fileStoreTmpDir,
        'config/test-android-20.0.0.json'
      )
      const hasCreatedConfig = fs.existsSync(pathToTargetConfig)
      expect(hasCreatedConfig).false
    })

    it('should copy the container version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.containerVersion).deep.equal(
        version1770.containerVersion
      )
    })

    it('should copy the ern version', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const sourceDescriptor = AppVersionDescriptor.fromString(
        'test:android:17.7.0'
      )
      const targetDescriptor = AppVersionDescriptor.fromString(
        'test:android:20.0.0'
      )
      await cauldronHelper.addNativeApplicationVersion(targetDescriptor)
      await cauldronHelper.copyNativeApplicationVersion({
        source: sourceDescriptor,
        target: targetDescriptor,
      })
      const testAndroid2000Path =
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="20.0.0")]'
      const version1770 = jp.query(fixture, testAndroid1770Path)[0]
      const version2000 = jp.query(fixture, testAndroid2000Path)[0]
      expect(version2000.container.ernVersion).deep.equal(
        version1770.container.ernVersion
      )
    })
  })

  describe('getMostRecentNativeApplicationVersion', () => {
    it('should return the latest version of the native application', async () => {
      const fixture = cloneFixture(fixtures.defaultCauldron)
      const cauldronHelper = createCauldronHelper({ cauldronDocument: fixture })
      const descriptor = AppPlatformDescriptor.fromString('test:android')
      const version1780 = jp.query(fixture, testAndroid1780Path)[0]
      const latestVersion = await cauldronHelper.getMostRecentNativeApplicationVersion(
        descriptor
      )
      expect(latestVersion).deep.equal(version1780)
    })
  })
})

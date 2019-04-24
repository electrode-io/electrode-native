import { assert, expect } from 'chai'
import sinon from 'sinon'
import { NativeApplicationDescriptor, PackagePath, utils } from 'ern-core'
import { doesThrow, doesNotThrow, fixtures } from 'ern-util-dev'
import { CauldronCodePushEntry } from '../src/types'
import CauldronApi from '../src/CauldronApi'
import EphemeralFileStore from '../src/EphemeralFileStore'
import InMemoryDocumentStore from '../src/InMemoryDocumentStore'
import jp from 'jsonpath'
import fs from 'fs'
import path, { dirname } from 'path'
const sandbox = sinon.createSandbox()

const codePushNewEntryFixture: CauldronCodePushEntry = {
  jsApiImpls: ['react-native-test-js-api-impl@1.0.0'],
  metadata: {
    appVersion: '17.7',
    deploymentName: 'QA',
    isMandatory: true,
    label: 'v18',
    releaseMethod: 'Upload',
    releasedBy: 'test@gmail.com',
    rollout: 100,
    size: 522938,
  },
  miniapps: ['@test/react-native-foo@4.0.4', 'react-native-bar@2.0.2'],
}

let documentStore
let fileStore

const fixtureFileStorePath = path.join(__dirname, 'fixtures', 'filestore')

function cauldronApi({
  cauldronDocument,
  storePath,
}: {
  cauldronDocument?: any
  storePath?: string
} = {}) {
  cauldronDocument = cauldronDocument || getCauldronFixtureClone()
  documentStore = new InMemoryDocumentStore(cauldronDocument)
  fileStore = new EphemeralFileStore({ storePath })

  return new CauldronApi(documentStore, fileStore)
}

function getCauldronFixtureClone() {
  return JSON.parse(JSON.stringify(fixtures.defaultCauldron))
}

describe('CauldronApi.js', () => {
  afterEach(() => {
    sandbox.restore()
  })

  // ==========================================================
  // upgradeCauldronSchema
  // ==========================================================
  describe('upgradeCauldronSchema', () => {
    it('should properly upgrade a cauldron [schema 0.0.0 => 3.0.0]', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(true)
      const fixture = JSON.parse(
        fs
          .readFileSync(path.join(__dirname, 'fixtures', 'cauldron-0.0.0.json'))
          .toString()
      )
      const api = cauldronApi({ cauldronDocument: fixture })
      await api.upgradeCauldronSchema()
      const expectedCauldronDoc = JSON.parse(
        fs
          .readFileSync(path.join(__dirname, 'fixtures', 'cauldron-3.0.0.json'))
          .toString()
      )
      const cauldronDoc = await api.getCauldron()
      expect(cauldronDoc).eql(expectedCauldronDoc)
    })
  })

  // ==========================================================
  // commit
  // ==========================================================
  describe('commit', () => {
    it('should call commit on the document store', async () => {
      const api = cauldronApi()
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.commit('commit-message')
      sinon.assert.calledOnce(commitStub)
    })

    it('should call commit with the proper commit message', async () => {
      const api = cauldronApi()
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.commit('commit-message')
      sinon.assert.calledWith(commitStub, 'commit-message')
    })
  })

  // ==========================================================
  // getCauldron
  // ==========================================================
  describe('getCauldron', () => {
    it('should return the Cauldron document', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const cauldron = await cauldronApi().getCauldron()
      expect(cauldron).eql(tmpFixture)
    })
  })

  // ==========================================================
  // getCauldronSchemaVersion
  // ==========================================================
  describe('getCauldronSchemaVersion', () => {
    it('should return the Cauldron schema version', async () => {
      const schemaVersion = await cauldronApi().getCauldronSchemaVersion()
      expect(schemaVersion).eql('3.0.0')
    })

    it('should return 0.0.0 if schemaVersion property is missing', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      delete tmpFixture.schemaVersion
      const schemaVersion = await cauldronApi({
        cauldronDocument: tmpFixture,
      }).getCauldronSchemaVersion()
      expect(schemaVersion).eql('0.0.0')
    })
  })

  // ==========================================================
  // beginTransaction
  // ==========================================================
  describe('beginTransaction', () => {
    it('should call beginTransaction on the document store', async () => {
      const api = cauldronApi()
      const beginTransactionStub = sandbox.stub(
        documentStore,
        'beginTransaction'
      )
      await api.beginTransaction()
      sinon.assert.calledOnce(beginTransactionStub)
    })

    it('should call beginTransaction on the file store', async () => {
      const api = cauldronApi()
      const beginTransactionStub = sandbox.stub(fileStore, 'beginTransaction')
      await api.beginTransaction()
      sinon.assert.calledOnce(beginTransactionStub)
    })
  })

  // ==========================================================
  // discardTransaction
  // ==========================================================
  describe('discardTransaction', () => {
    it('should call discardTransaction on the document store', async () => {
      const api = cauldronApi()
      const discardTransactionStub = sandbox.stub(
        documentStore,
        'discardTransaction'
      )
      await api.discardTransaction()
      sinon.assert.calledOnce(discardTransactionStub)
    })

    it('should call discardTransaction on the file store', async () => {
      const api = cauldronApi()
      const discardTransactionStub = sandbox.stub(
        fileStore,
        'discardTransaction'
      )
      await api.discardTransaction()
      sinon.assert.calledOnce(discardTransactionStub)
    })
  })

  // ==========================================================
  // commitTransaction
  // ==========================================================
  describe('commitTransaction', () => {
    it('should call commitTransaction on the document store', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(
        documentStore,
        'commitTransaction'
      )
      await api.commitTransaction('commit-message')
      sinon.assert.calledOnce(commitTransactionStub)
    })

    it('should call commitTransaction on the document store with the right commit message', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(
        documentStore,
        'commitTransaction'
      )
      await api.commitTransaction('commit-message')
      sinon.assert.calledWith(commitTransactionStub, 'commit-message')
    })

    it('should call commitTransaction on the file store ', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(fileStore, 'commitTransaction')
      await api.commitTransaction('commit-message')
      sinon.assert.calledOnce(commitTransactionStub)
    })

    it('should call commitTransaction on the file store with the right commit message', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(fileStore, 'commitTransaction')
      await api.commitTransaction('commit-message')
      sinon.assert.calledWith(commitTransactionStub, 'commit-message')
    })
  })

  // ==========================================================
  // getNativeApplications
  // ==========================================================
  describe('getNativeApplications', () => {
    it('should return the native applications', async () => {
      const nativeApps = await cauldronApi().getNativeApplications()
      expect(nativeApps).eql(fixtures.defaultCauldron.nativeApps)
    })
  })

  // ==========================================================
  // getNativeApplication
  // ==========================================================
  describe('getNativeApplication', () => {
    it('should return the native applications array', async () => {
      const nativeApp = await cauldronApi().getNativeApplication(
        NativeApplicationDescriptor.fromString('test')
      )
      const nativeAppsObj = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")]'
      )[0]
      expect(nativeApp).eql(nativeAppsObj)
    })

    it('should throw if the application name is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getNativeApplication,
          api,
          NativeApplicationDescriptor.fromString('unexisting')
        )
      )
    })
  })

  // ==========================================================
  // getPlatforms
  // ==========================================================
  describe('getPlatforms', () => {
    it('should return the platforms array', async () => {
      const platforms = await cauldronApi().getPlatforms(
        NativeApplicationDescriptor.fromString('test')
      )
      expect(platforms)
        .to.be.an('array')
        .of.length(1)
    })

    it('should throw if the application name is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getPlatforms,
          api,
          NativeApplicationDescriptor.fromString('unexisting')
        )
      )
    })
  })

  // ==========================================================
  // getPlatform
  // ==========================================================
  describe('getPlatform', () => {
    it('should return the platform object given its name', async () => {
      const platformObj = await cauldronApi().getPlatform(
        NativeApplicationDescriptor.fromString('test:android')
      )
      const platform = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]'
      )[0]
      expect(platform).eql(platformObj)
    })

    it('should throw if the platform is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getPlatform,
          api,
          NativeApplicationDescriptor.fromString('test:ios')
        )
      )
    })

    it('should throw if the native application is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getPlatform,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android')
        )
      )
    })
  })

  // ==========================================================
  // getVersions
  // ==========================================================
  describe('getVersions', () => {
    it('should return the versions array', async () => {
      const versionsArr = await cauldronApi().getVersions(
        NativeApplicationDescriptor.fromString('test:android')
      )
      const versions = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions'
      )[0]
      expect(versionsArr).eql(versions)
    })

    it('should throw if the native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getVersions,
          api,
          NativeApplicationDescriptor.fromString('test:ios')
        )
      )
    })

    it('should throw if the native application name does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getVersions,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android')
        )
      )
    })
  })

  // ==========================================================
  // getVersion
  // ==========================================================
  describe('getVersion', () => {
    it('should return the version object', async () => {
      const versionObj = await cauldronApi().getVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const version = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(versionObj).eql(version)
    })

    it('should throw if the native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getVersion,
          api,
          NativeApplicationDescriptor.fromString('test:android:0.1.0')
        )
      )
    })

    it('should throw if the native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getVersion,
          api,
          NativeApplicationDescriptor.fromString('test:ios:0.1.0')
        )
      )
    })

    it('should throw if the native application name does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getVersion,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android:17.7.0')
        )
      )
    })
  })

  // ==========================================================
  // getCodePushEntries
  // ==========================================================
  describe('getCodePushEntries', () => {
    it('should return the code push Production entries', async () => {
      const entries = await cauldronApi().getCodePushEntries(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(entries)
        .to.be.an('array')
        .of.length(2)
    })

    it('should return the code push QA entries', async () => {
      const entries = await cauldronApi().getCodePushEntries(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'QA'
      )
      expect(entries)
        .to.be.an('array')
        .of.length(1)
    })

    it('should throw if native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getCodePushEntries,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0'),
          'QA'
        )
      )
    })

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getCodePushEntries,
          api,
          NativeApplicationDescriptor.fromString('test:ios:1.0.0'),
          'QA'
        )
      )
    })

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getCodePushEntries,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android:17.7.0'),
          'QA'
        )
      )
    })
  })

  // ==========================================================
  // setCodePushEntries
  // ==========================================================
  describe('setCodePushEntries', () => {
    it('should set the code push entries', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).setCodePushEntries(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'QA',
        [codePushNewEntryFixture]
      )
      const codePushEntries = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["QA"]'
      )[0]
      expect(codePushEntries).eql([codePushNewEntryFixture])
    })

    it('should throw if the native application version does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.setCodePushEntries,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0'),
          'QA',
          [codePushNewEntryFixture]
        )
      )
    })
  })

  // ==========================================================
  // getContainerMiniApps
  // ==========================================================
  describe('getContainerMiniApps', () => {
    it('should return the MiniApps array of a native application version Container', async () => {
      const containerMiniApps = await cauldronApi().getContainerMiniApps(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      expect(containerMiniApps)
        .to.be.an('array')
        .of.length(2)
    })

    it('should throw if native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerMiniApps,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0')
        )
      )
    })

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerMiniApps,
          api,
          NativeApplicationDescriptor.fromString('test:unexisting:17.7.0')
        )
      )
    })

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerMiniApps,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android:17.7.0')
        )
      )
    })
  })

  // ==========================================================
  // getNativeDependencies
  // ==========================================================
  describe('getNativeDependencies', () => {
    it('should return the native dependencies of a native application version Container', async () => {
      const containerDependencies = await cauldronApi().getNativeDependencies(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      expect(containerDependencies)
        .to.be.an('array')
        .of.length(4)
    })

    it('should throw if native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getNativeDependencies,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0')
        )
      )
    })

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getNativeDependencies,
          api,
          NativeApplicationDescriptor.fromString('test:unexisting:17.7.0')
        )
      )
    })

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getNativeDependencies,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android:17.7.0')
        )
      )
    })
  })

  // ==========================================================
  // getContainerJsApiImpls
  // ==========================================================
  describe('getContainerJsApiImpls', () => {
    it('should throw an error if the native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerJsApiImpls,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0')
        )
      )
    })

    it('should return the JavaScript API implementations package paths', async () => {
      const result = await cauldronApi().getContainerJsApiImpls(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
      expect(result[0]).eql('react-native-my-api-impl@1.0.0')
    })
  })

  // ==========================================================
  // getContainerJsApiImpl
  // ==========================================================
  describe('getContainerJsApiImpl', () => {
    it('should throw an error if the native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerJsApiImpl,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.10.0'),
          'react-native-my-api-impl'
        )
      )
    })

    it('should return the JavaScript API implementation package path [1]', async () => {
      const result = await cauldronApi().getContainerJsApiImpl(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-my-api-impl'
      )
      expect(result).eql('react-native-my-api-impl@1.0.0')
    })

    it('should return the JavaScript API implementation package path [2]', async () => {
      const result = await cauldronApi().getContainerJsApiImpl(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-my-api-impl@1.0.0'
      )
      expect(result).eql('react-native-my-api-impl@1.0.0')
    })
  })

  // ==========================================================
  // getNativeDependency
  // ==========================================================
  describe('getNativeDependency', () => {
    it('should return the native dependency string if no version is provided', async () => {
      const dependency = await cauldronApi().getContainerNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-electrode-bridge'
      )
      expect(dependency).eql('react-native-electrode-bridge@1.4.9')
    })

    it('should return the native dependency string if version is provided', async () => {
      const dependency = await cauldronApi().getContainerNativeDependency(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'react-native-electrode-bridge@1.4.9'
      )
      expect(dependency).eql('react-native-electrode-bridge@1.4.9')
    })

    it('should throw if incorrect version is provided', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerNativeDependency,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          'react-native-electrode-bridge@0.1.0'
        )
      )
    })

    it('should throw if dependency does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerNativeDependency,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          'unexisting'
        )
      )
    })

    it('should throw if native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerNativeDependency,
          api,
          NativeApplicationDescriptor.fromString('test:android:0.1.0'),
          'react-native-electrode-bridge'
        )
      )
    })

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerNativeDependency,
          api,
          NativeApplicationDescriptor.fromString('test:unexisting:17.7.0'),
          'react-native-electrode-bridge'
        )
      )
    })

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerNativeDependency,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android:17.7.0'),
          'react-native-electrode-bridge'
        )
      )
    })
  })

  // ==========================================================
  // getConfig
  // ==========================================================
  describe('getConfig', () => {
    it('[get application version config] should return the native application version config', async () => {
      const configObj = await cauldronApi({
        storePath: fixtureFileStorePath,
      }).getConfig(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const config = fs.readFileSync(
        path.join(fixtureFileStorePath, 'config', 'test-android-17.7.0.json')
      )
      expect(configObj).eql(JSON.parse(config.toString()))
    })

    it('[get application version config] should throw if the native application version does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getConfig,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0')
        )
      )
    })

    it('[get application platform config] should return the native application platform config', async () => {
      const configObj = await cauldronApi({
        storePath: fixtureFileStorePath,
      }).getConfig(NativeApplicationDescriptor.fromString('test:android'))
      const config = fs.readFileSync(
        path.join(fixtureFileStorePath, 'config', 'test-android.json')
      )
      expect(configObj).eql(JSON.parse(config.toString()))
    })

    it('[get application platform config] should throw if the native application platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getConfig,
          api,
          NativeApplicationDescriptor.fromString('test:unexisting')
        )
      )
    })

    it('[get application config] should return the native application name config', async () => {
      const configObj = await cauldronApi({
        storePath: fixtureFileStorePath,
      }).getConfig(NativeApplicationDescriptor.fromString('test'))
      const config = fs.readFileSync(
        path.join(fixtureFileStorePath, 'config', 'test.json')
      )
      expect(configObj).eql(JSON.parse(config.toString()))
    })

    it('[get application config] should throw if native application does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getConfig,
          api,
          NativeApplicationDescriptor.fromString('unexisting')
        )
      )
    })
  })

  // ==========================================================
  // clearCauldron
  // ==========================================================
  describe('clearCauldron', () => {
    it('should empty the Cauldron', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).clearCauldron()
      expect(tmpFixture.nativeApps).empty
    })
  })

  // ==========================================================
  // addDescriptor
  // ==========================================================
  describe('addDescriptor', () => {
    it('should add a native application entry', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addDescriptor(
        NativeApplicationDescriptor.fromString('newapp')
      )
      const app = jp.query(tmpFixture, '$.nativeApps[?(@.name=="newapp")]')[0]
      expect(app).not.undefined
    })

    it('should add a native application and platform entry', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addDescriptor(
        NativeApplicationDescriptor.fromString('newapp:android')
      )
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="newapp")].platforms[?(@.name=="android")]'
      )[0]
      expect(platform).not.undefined
    })

    it('should add a native application and platform and version entry', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addDescriptor(
        NativeApplicationDescriptor.fromString('newapp:android:1.0.0')
      )
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="newapp")].platforms[?(@.name=="android")].versions[?(@.name=="1.0.0")]'
      )[0]
      expect(platform).not.undefined
    })
  })

  // ==========================================================
  // removeDescriptor
  // ==========================================================
  describe('removeDescriptor', () => {
    it('should remove a top level native app', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).removeDescriptor(
        NativeApplicationDescriptor.fromString('test')
      )
      const result = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")]')[0]
      expect(result).undefined
    })

    it('should remove a native application platform', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).removeDescriptor(
        NativeApplicationDescriptor.fromString('test:android')
      )
      const result = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]'
      )[0]
      expect(result).undefined
    })

    it('should remove a native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).removeDescriptor(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const result = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(result).undefined
    })
  })

  // ==========================================================
  // createNativeApplication
  // ==========================================================
  describe('createNativeApplication', () => {
    it('should create the native application object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).createNativeApplication({ name: 'newapp' })
      const app = jp.query(tmpFixture, '$.nativeApps[?(@.name=="newapp")]')[0]
      expect(app).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createNativeApplication({ name: 'newapp' })
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application name already exists', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      assert(
        await doesThrow(api.createNativeApplication, api, { name: 'test' })
      )
    })
  })

  // ==========================================================
  // removeNativeApplication
  // ==========================================================
  describe('removeNativeApplication', () => {
    it('should remove the native application given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeNativeApplication(NativeApplicationDescriptor.fromString('test'))
      const nativeApp = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")]'
      )[0]
      expect(nativeApp).undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeNativeApplication(
        NativeApplicationDescriptor.fromString('test')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the application name does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeNativeApplication,
          api,
          NativeApplicationDescriptor.fromString('unexisting')
        )
      )
    })
  })

  // ==========================================================
  // createPlatform
  // ==========================================================
  describe('createPlatform', () => {
    it('should create the platform object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).createPlatform(
        NativeApplicationDescriptor.fromString('test'),
        { name: 'ios' }
      )
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="ios")]'
      )[0]
      expect(platform).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createPlatform(NativeApplicationDescriptor.fromString('test'), {
        name: 'ios',
      })
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the application platform already exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.createPlatform,
          api,
          NativeApplicationDescriptor.fromString('test'),
          { name: 'android' }
        )
      )
    })
  })

  // ==========================================================
  // removePlatform
  // ==========================================================
  describe('removePlatform', () => {
    it('should remove the native application platform given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).removePlatform(
        NativeApplicationDescriptor.fromString('test:android')
      )
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]'
      )[0]
      expect(platform).undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removePlatform(
        NativeApplicationDescriptor.fromString('test:android')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the application name does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removePlatform,
          api,
          NativeApplicationDescriptor.fromString('unexisting:android')
        )
      )
    })

    it('should throw if the application platform does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removePlatform,
          api,
          NativeApplicationDescriptor.fromString('test:unexisting')
        )
      )
    })
  })

  // ==========================================================
  // createVersion
  // ==========================================================
  describe('createVersion', () => {
    it('should create the version object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).createVersion(
        NativeApplicationDescriptor.fromString('test:android'),
        { name: '17.20.0' }
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.20.0")]'
      )[0]
      expect(version).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createVersion(
        NativeApplicationDescriptor.fromString('test:android'),
        { name: '17.20.0' }
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the platform does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.createVersion,
          api,
          NativeApplicationDescriptor.fromString('test:ios'),
          { name: '17.20.0' }
        )
      )
    })

    it('should throw if the version already exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.createVersion,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          { name: '17.7.0' }
        )
      )
    })
  })

  // ==========================================================
  // removeVersion
  // ==========================================================
  describe('removeVersion', () => {
    it('should remove the native application version given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).removeVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version).undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the platform name does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeVersion,
          api,
          NativeApplicationDescriptor.fromString('test:unexisting:17.7.0')
        )
      )
    })

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeVersion,
          api,
          NativeApplicationDescriptor.fromString('test:android:1.0.0')
        )
      )
    })
  })

  // ==========================================================
  // updateVersion
  // ==========================================================
  describe('updateVersion', () => {
    it('should perform the update', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).updateVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        { isReleased: false }
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version.isReleased).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        { isReleased: false }
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateVersion,
          api,
          NativeApplicationDescriptor.fromString('test:android:0.1.0'),
          { isReleased: false }
        )
      )
    })
  })

  // ==========================================================
  // addOrUpdateDescription
  // ==========================================================

  describe('addOrUpdateDescription', () => {
    it('should add a description if it does not exist yet', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const newDescription = 'new description'
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addOrUpdateDescription(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        newDescription
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version.description).eql(newDescription)
    })

    it('should update a description if it already exist', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const updatedDescription = 'updated description'
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addOrUpdateDescription(
        NativeApplicationDescriptor.fromString('test:android:17.8.0'),
        updatedDescription
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.8.0")]'
      )[0]
      expect(version.description).eql(updatedDescription)
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addOrUpdateDescription(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'new description'
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addOrUpdateDescription,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          'new description'
        )
      )
    })

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addOrUpdateDescription,
          api,
          NativeApplicationDescriptor.fromString('test:android:0.1.0'),
          'new description'
        )
      )
    })
  })

  // ==========================================================
  // removeNativeDependencyFromContainer
  // ==========================================================
  describe('removeNativeDependencyFromContainer', () => {
    it('should remove the native dependency', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeNativeDependencyFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-electrode-bridge')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps'
      )[0]
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.4.9'))
        .false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeNativeDependencyFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-electrode-bridge')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the dependency is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeNativeDependencyFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('unexisting')
        )
      )
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeNativeDependencyFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'react-native-electrode-bridge'
        )
      )
    })
  })

  // ==========================================================
  // updateNativeDependencyVersionInContainer
  // ==========================================================
  describe('updateNativeDependencyVersionInContainer', () => {
    it('should update the native dependency', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateNativeDependencyVersionInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-electrode-bridge@1.5.0')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps'
      )[0]
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.4.9'))
        .false
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.5.0'))
        .true
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateNativeDependencyVersionInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-electrode-bridge@1.5.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the dependency is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateNativeDependencyVersionInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('unexisting@1.5.0')
        )
      )
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateNativeDependencyVersionInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('react-native-electrode-bridge@1.5.0')
        )
      )
    })
  })

  // ==========================================================
  // updateMiniAppVersionInContainer
  // ==========================================================
  describe('updateMiniAppVersionInContainer', () => {
    it('should update the MiniApp version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateMiniAppVersionInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar@3.0.0')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps'
      )[0]
      expect(miniAppsArr.includes('react-native-bar@3.0.0')).true
      expect(miniAppsArr.includes('react-native-bar@2.0.0')).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateMiniAppVersionInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar@3.0.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the miniapp is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateMiniAppVersionInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-foo@3.0.0')
        )
      )
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateMiniAppVersionInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('react-native-bar@3.0.0')
        )
      )
    })
  })

  // ==========================================================
  // updateTopLevelContainerVersion
  // ==========================================================
  describe('updateTopLevelContainerVersion', () => {
    it('should update the top level container version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateTopLevelContainerVersion(
        NativeApplicationDescriptor.fromString('test:android'),
        '2.0.0'
      )
      const topLevelContainerVersion = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].containerVersion'
      )[0]
      expect(topLevelContainerVersion).eql('2.0.0')
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateTopLevelContainerVersion(
        NativeApplicationDescriptor.fromString('test:android'),
        '2.0.0'
      )
      sinon.assert.calledOnce(commitStub)
    })
  })

  // ==========================================================
  // updateContainerVersion
  // ==========================================================
  describe('updateContainerVersion', () => {
    it('should update the container version of the given native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateContainerVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        '2.0.0'
      )
      const nativeAppContainerVersion = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].containerVersion'
      )[0]
      expect(nativeAppContainerVersion).eql('2.0.0')
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateContainerVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        '2.0.0'
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateContainerVersion,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          '2.0.0'
        )
      )
    })
  })

  // ==========================================================
  // getTopLevelContainerVersion
  // ==========================================================
  describe('getTopLevelContainerVersion', () => {
    it('should return the top level container version', async () => {
      const result = await cauldronApi().getTopLevelContainerVersion(
        NativeApplicationDescriptor.fromString('test:android')
      )
      expect(result).eql('1.16.44')
    })
  })

  // ==========================================================
  // getContainerVersion
  // ==========================================================
  describe('getContainerVersion', () => {
    it('should return the container version of the given native application version', async () => {
      const result = await cauldronApi().getContainerVersion(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      expect(result).eql('1.16.44')
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getContainerVersion,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0')
        )
      )
    })
  })

  // ==========================================================
  // removeMiniAppFromContainer
  // ==========================================================
  describe('removeMiniAppFromContainer', () => {
    it('should remove the MiniApp from the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeMiniAppFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps'
      )[0]
      expect(miniAppsArr.includes('react-native-bare@2.0.0')).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeMiniAppFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the MiniApp is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeMiniAppFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('unexisting')
        )
      )
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeMiniAppFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('react-native-bar')
        )
      )
    })
  })

  // ==========================================================
  // addMiniAppToContainer
  // ==========================================================
  describe('addMiniAppToContainer', () => {
    it('should add the MiniApp to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addMiniAppToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('newMiniApp@1.0.0')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps'
      )[0]
      expect(miniAppsArr.includes('newMiniApp@1.0.0')).true
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addMiniAppToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('newMiniApp@1.0.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the MiniApp already exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addMiniAppToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-bar@2.0.0')
        )
      )
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addMiniAppToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('newMiniApp@1.0.0')
        )
      )
    })
  })

  // ==========================================================
  // addNativeDependencyToContainer
  // ==========================================================
  describe('addNativeDependencyToContainer', () => {
    it('should add the native dependency to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addNativeDependencyToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('testDep@1.0.0')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps'
      )[0]
      expect(dependenciesArr.includes('testDep@1.0.0')).true
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addNativeDependencyToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('testDep@1.0.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the dependency already exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addNativeDependencyToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-electrode-bridge@1.4.9')
        )
      )
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addNativeDependencyToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('testDep@1.0.0')
        )
      )
    })
  })

  // ==========================================================
  // addJsApiImplToContainer
  // ==========================================================
  describe('addJsApiImplToContainer', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addJsApiImplToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('react-native-new-js-api-impl@1.0.0')
        )
      )
    })

    it('should throw if the js api impl already exists', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addJsApiImplToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-my-api-impl@1.0.0')
        )
      )
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addJsApiImplToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-new-js-api-impl@1.0.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should add the JS API impl to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addJsApiImplToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-new-js-api-impl@1.0.0')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls'
      )[0]
      expect(dependenciesArr.includes('react-native-new-js-api-impl@1.0.0'))
        .true
    })
  })

  // ==========================================================
  // removeJsApiImplFromContainer
  // ==========================================================
  describe('removeJsApiImplFromContainer', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeJsApiImplFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('react-native-my-api-impl@1.0.0')
        )
      )
    })

    it('should throw if the js api impl is not found [1]', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeJsApiImplFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-unknown-api-impl')
        )
      )
    })

    it('should throw if the js api impl is not found [2]', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeJsApiImplFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-unknown-api-impl@1.0.0')
        )
      )
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeJsApiImplFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@1.0.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should remove the JS API impl from the container of the native application version [1]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeJsApiImplFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls'
      )[0]
      expect(dependenciesArr).not.includes('react-native-my-api-impl@1.0.0')
    })

    it('should remove the JS API impl from the container of the native application version [2]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeJsApiImplFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@1.0.0')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls'
      )[0]
      expect(dependenciesArr).not.includes('react-native-my-api-impl@1.0.0')
    })
  })

  // ==========================================================
  // updateJsApiImplVersionInContainer
  // ==========================================================
  describe('updateJsApiImplVersionInContainer', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateJsApiImplVersionInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          PackagePath.fromString('react-native-my-api-impl@2.0.0')
        )
      )
    })

    it('should throw if the js api impl is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateJsApiImplVersionInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('react-native-unknown-api-impl@1.0.0')
        )
      )
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateJsApiImplVersionInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@2.0.0')
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should update the JS API impl version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateJsApiImplVersionInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@2.0.0')
      )
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls'
      )[0]
      expect(dependenciesArr).includes('react-native-my-api-impl@2.0.0')
    })
  })

  // ==========================================================
  // addCodePushEntry
  // ==========================================================
  describe('addCodePushEntry', () => {
    it('should add the code push entry to QA', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushNewEntryFixture
      )
      const entries = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["QA"]'
      )[0]
      expect(entries)
        .to.be.an('array')
        .of.length(2)
    })

    it('should add the code push entry to new deployment name', async () => {
      const modifiedCodePushEntryFixture = Object.assign(
        {},
        codePushNewEntryFixture
      )
      modifiedCodePushEntryFixture.metadata.deploymentName = 'STAGING'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        modifiedCodePushEntryFixture
      )
      const entries = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["STAGING"]'
      )[0]
      expect(entries)
        .to.be.an('array')
        .of.length(1)
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushNewEntryFixture
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addCodePushEntry,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          codePushNewEntryFixture
        )
      )
    })
  })

  // ==========================================================
  // addFile
  // ==========================================================
  describe('addFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addFile, api, { fileContent: 'content' }))
    })

    it('should throw if fileContent is undefined', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(api.addFile, api, { cauldronFilePath: 'dir/file' })
      )
    })

    it('should throw if file already exist', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(
        await doesThrow(api.addFile, api, {
          cauldronFilePath: 'dir/file',
          fileContent: 'newcontent',
        })
      )
    })

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi()
      assert(
        await doesNotThrow(api.addFile, api, {
          cauldronFilePath: 'dir/file',
          fileContent: 'content',
        })
      )
    })

    it('should add the file [non cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(await api.hasFile({ cauldronFilePath: 'dir/file' }))
    })

    it('should add the file [cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'cauldron://dir/file',
        fileContent: 'content',
      })
      assert(await api.hasFile({ cauldronFilePath: 'dir/file' }))
    })
  })

  // ==========================================================
  // updateFile
  // ==========================================================
  describe('updateFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateFile, api, { fileContent: 'content' }))
    })

    it('should throw if fileContent is undefined', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(api.updateFile, api, { cauldronFilePath: 'dir/file' })
      )
    })

    it('should throw if file does not already exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(api.updateFile, api, {
          cauldronFilePath: 'dir/file',
          fileContent: 'newcontent',
        })
      )
    })

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(
        await doesNotThrow(api.updateFile, api, {
          cauldronFilePath: 'dir/file',
          fileContent: 'content',
        })
      )
    })

    it('should update the file [non cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(
        await doesNotThrow(api.updateFile, api, {
          cauldronFilePath: 'dir/file',
          fileContent: 'content',
        })
      )
    })

    it('should update the file [cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(
        await doesNotThrow(api.updateFile, api, {
          cauldronFilePath: 'cauldron://dir/file',
          fileContent: 'content',
        })
      )
    })
  })

  // ==========================================================
  // removeFile
  // ==========================================================
  describe('removeFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeFile, api, {}))
    })

    it('should throw if file does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(api.removeFile, api, {
          cauldronFilePath: 'dir/file',
        })
      )
    })

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(
        await doesNotThrow(api.removeFile, api, {
          cauldronFilePath: 'dir/file',
        })
      )
    })

    it('should remove the file [non cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      await api.removeFile({
        cauldronFilePath: 'dir/file',
      })
      assert(!(await api.hasFile({ cauldronFilePath: 'dir/file' })))
    })

    it('should remove the file [cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      await api.removeFile({
        cauldronFilePath: 'cauldron://dir/file',
      })
      assert(!(await api.hasFile({ cauldronFilePath: 'dir/file' })))
    })
  })

  // ==========================================================
  // getFile
  // ==========================================================
  describe('getFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.getFile, api, {}))
    })

    it('should throw if file does not exist', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(api.getFile, api, {
          cauldronFilePath: 'dir/file',
        })
      )
    })

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      assert(
        await doesNotThrow(api.getFile, api, {
          cauldronFilePath: 'dir/file',
        })
      )
    })

    it('should get the file [non cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      const file = await api.getFile({ cauldronFilePath: 'dir/file' })
      expect(file.toString()).eql('content')
    })

    it('should get the file [cauldron scheme]', async () => {
      const api = cauldronApi()
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      })
      const file = await api.getFile({
        cauldronFilePath: 'cauldron://dir/file',
      })
      expect(file.toString()).eql('content')
    })
  })

  // ==========================================================
  // hasYarnLock
  // ==========================================================
  describe('hasYarnLock', () => {
    it('should return true if the native application version has the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(hasYarnLock).to.be.true
    })

    it('should return false if the native application version does not have the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Unexisting'
      )
      expect(hasYarnLock).to.be.false
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.hasYarnLock,
          api,
          'test',
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'Production'
        )
      )
    })
  })

  // ==========================================================
  // addYarnLock
  // ==========================================================
  describe('addYarnLock', () => {
    it('should properly add the yarn lock', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'YARN_LOCK_KEY',
        'YARN_LOCK_CONTENT'
      )
      const entry = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["YARN_LOCK_KEY"]'
      )[0]
      expect(entry).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addYarnLock(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'YARN_LOCK_KEY',
        'YARN_LOCK_CONTENT'
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addYarnLock,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'YARN_LOCK_KEY',
          'YARN_LOCK_CONTENT'
        )
      )
    })
  })

  // ==========================================================
  // getYarnLockId
  // ==========================================================
  describe('getYarnLockId', () => {
    it('should properly return the yarn lock id if it exists', async () => {
      const id = await cauldronApi().getYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(id).eql('a0112c49-4bbc-47a9-ba45-d43e1e84a1a5')
    })

    it('should return undefined if the yarn lock key does not exists', async () => {
      const id = await cauldronApi().getYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'UnknownKey'
      )
      expect(id).undefined
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getYarnLockId,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'Production'
        )
      )
    })
  })

  // ==========================================================
  // setYarnLockId
  // ==========================================================
  describe('setYarnLockId', () => {
    it('should properly set the yarn lock id of an existing key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).setYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production',
        newId
      )
      const entry = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["Production"]'
      )[0]
      expect(entry).eql(newId)
    })

    it('should properly set the yarn lock id of an unexisting key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).setYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'NewKey',
        newId
      )
      const entry = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["NewKey"]'
      )[0]
      expect(entry).eql(newId)
    })

    it('should commit the document store', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.setYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'NewKey',
        newId
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.setYarnLockId,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'NewKey',
          newId
        )
      )
    })
  })

  // ==========================================================
  // getYarnLock
  // ==========================================================
  describe('getYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getYarnLock,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'Production'
        )
      )
    })
  })

  // ==========================================================
  // getPathToYarnLock
  // ==========================================================
  describe('getPathToYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getPathToYarnLock,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'Production'
        )
      )
    })
  })

  // ==========================================================
  // removeYarnLock
  // ==========================================================
  describe('removeYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.removeYarnLock,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'Production'
        )
      )
    })
  })

  // ==========================================================
  // updateYarnLock
  // ==========================================================
  describe('updateYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateYarnLock,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'Production',
          'NewLock'
        )
      )
    })
  })

  // ==========================================================
  // updateYarnLockId
  // ==========================================================
  describe('updateYarnLockId', () => {
    it('should properly update the yarn lock id of an existing key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      await api.updateYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production',
        newId
      )
      const id = await api.getYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'Production'
      )
      expect(id).eql(newId)
    })

    it('should properly set the yarn lock id of an unexisting key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      await api.updateYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'NewKey',
        newId
      )
      const id = await api.getYarnLockId(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'NewKey'
      )
      expect(id).eql(newId)
    })

    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateYarnLockId,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          'NewKey'
        )
      )
    })
  })

  // ==========================================================
  // setYarnLocks
  // ==========================================================
  describe('setYarnLocks', () => {
    it('should set the yarn locks', async () => {
      const yarnLocks = { test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' }
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).setYarnLocks(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        yarnLocks
      )
      const yarnLocksObj = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks'
      )[0]
      expect(yarnLocksObj).eql(yarnLocks)
    })

    it('should commit the document store', async () => {
      const yarnLocks = { test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' }
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.setYarnLocks(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        yarnLocks
      )
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.setYarnLocks,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.20.0'),
          { Test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' }
        )
      )
    })
  })

  // ==========================================================
  // addBundle
  // ==========================================================
  describe('addBundle', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addBundle,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          'BUNDLE_CONTENT'
        )
      )
    })

    it('should properly add the bundle', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({ cauldronDocument: tmpFixture }).addBundle(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT'
      )
    })
  })

  // ==========================================================
  // hasBundle
  // ==========================================================
  describe('hasBundle', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.hasBundle,
          api,
          NativeApplicationDescriptor.fromString('test:android')
        )
      )
    })

    it('should return true if there is a stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addBundle(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT'
      )
      assert(
        await api.hasBundle(
          NativeApplicationDescriptor.fromString('test:android:17.7.0')
        )
      )
    })

    it('should return false if there is no stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      assert(
        !(await api.hasBundle(
          NativeApplicationDescriptor.fromString('test:android:17.7.0')
        ))
      )
    })
  })

  // ==========================================================
  // getBundle
  // ==========================================================
  describe('getBundle', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.getBundle,
          api,
          NativeApplicationDescriptor.fromString('test:android')
        )
      )
    })

    it('should throw if there is no stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      assert(
        await doesThrow(
          api.getBundle,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0')
        )
      )
    })

    it('should return the stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addBundle(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT'
      )
      const result = await api.getBundle(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      expect(result.toString()).eql('BUNDLE_CONTENT')
    })
  })

  // ==========================================================
  // addMiniAppBranchToContainer
  // ==========================================================
  describe('addMiniAppBranchToContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addMiniAppBranchToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
        )
      )
    })

    it('should throw if the MiniApp path does not include a branch', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addMiniAppBranchToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('https://github.com/foo/MiniApp.git')
        )
      )
    })

    it('should add the MiniApp to the target container miniAppsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches'
      )[0]
      expect(miniAppsArr.includes('https://github.com/foo/MiniApp.git#master'))
        .true
    })

    it('should throw if the MiniApp already has a branch specified', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      assert(
        await doesThrow(
          api.addMiniAppBranchToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString(
            'https://github.com/foo/MiniApp.git#development'
          )
        )
      )
    })
  })

  // ==========================================================
  // addJsApiImplBranchToContainer
  // ==========================================================
  describe('addJsApiImplBranchToContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addJsApiImplBranchToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
        )
      )
    })

    it('should throw if the JS API Impl path does not include a branch', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.addJsApiImplBranchToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('https://github.com/foo/JsApiImpl.git')
        )
      )
    })

    it('should add the JS API Impl to the target container jsApiImplsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      const jsApiImplsBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches'
      )[0]
      expect(
        jsApiImplsBranchesArr.includes(
          'https://github.com/foo/JsApiImpl.git#master'
        )
      ).true
    })

    it('should throw if the JS API impl already has a branch specified', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      assert(
        await doesThrow(
          api.addJsApiImplBranchToContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString(
            'https://github.com/foo/JsApiImpl.git#development'
          )
        )
      )
    })
  })

  // ==========================================================
  // updateMiniAppBranchInContainer
  // ==========================================================
  describe('updateMiniAppBranchInContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateMiniAppBranchInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
        )
      )
    })

    it('should throw if the MiniApp path does not include a branch', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateMiniAppBranchInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('https://github.com/foo/MiniApp.git')
        )
      )
    })

    it('should update the MiniApp branch in the target container miniAppsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateMiniAppBranchInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#development')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches'
      )[0]
      expect(
        miniAppsArr.includes('https://github.com/foo/MiniApp.git#development')
      ).true
    })
  })

  // ==========================================================
  // updateJsApiImplBranchInContainer
  // ==========================================================
  describe('updateJsApiImplBranchInContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateJsApiImplBranchInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
        )
      )
    })

    it('should throw if the JS API Impl path does not include a branch', async () => {
      const api = cauldronApi()
      assert(
        await doesThrow(
          api.updateJsApiImplBranchInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('https://github.com/foo/JsApiImpl.git')
        )
      )
    })

    it('should update the JS API Impl branch in the target container jsApiImplsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateJsApiImplBranchInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString(
          'https://github.com/foo/JsApiImpl.git#development'
        )
      )
      const jsApiImplsBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches'
      )[0]
      expect(
        jsApiImplsBranchesArr.includes(
          'https://github.com/foo/JsApiImpl.git#development'
        )
      ).true
    })
  })

  // ==========================================================
  // removeMiniAppBranchFromContainer
  // ==========================================================
  describe('removeMiniAppBranchFromContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      assert(
        await doesThrow(
          api.removeMiniAppBranchFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
        )
      )
    })

    it('should throw if the MiniApp does not exist in the miniAppsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      assert(
        await doesThrow(
          api.removeMiniAppBranchFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('https://github.com/foo/foo.git')
        )
      )
    })

    it('should remove the MiniApp branch from the target container miniAppsBranches array [branch specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeMiniAppBranchFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches'
      )[0]
      expect(miniAppsArr).empty
    })

    it('should remove the MiniApp branch from the target container miniAppsBranches array [branch not specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addMiniAppBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git#master')
      )
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeMiniAppBranchFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/MiniApp.git')
      )
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches'
      )[0]
      expect(miniAppsArr).empty
    })
  })

  // ==========================================================
  // removeJsApiImplBranchFromContainer
  // ==========================================================
  describe('removeJsApiImplBranchFromContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      assert(
        await doesThrow(
          api.removeJsApiImplBranchFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
        )
      )
    })

    it('should throw if the JS API Impl does not exist in the jsApiImplsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      assert(
        await doesThrow(
          api.removeJsApiImplBranchFromContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android:17.7.0'),
          PackagePath.fromString('https://github.com/foo/foo.git')
        )
      )
    })

    it('should remove the JS API Impl branch from the target container jsApiImplsBranches array [branch specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeJsApiImplBranchFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      const jsApiImplBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches'
      )[0]
      expect(jsApiImplBranchesArr).empty
    })

    it('should remove the JS API Impl branch from the target container miniAppsBranches array [branch not specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeJsApiImplBranchFromContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git')
      )
      const jsApiImplBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches'
      )[0]
      expect(jsApiImplBranchesArr).empty
    })
  })

  // ==========================================================
  // hasJsApiImplBranchInContainer
  // ==========================================================
  describe('hasJsApiImplBranchInContainer', () => {
    it('should throw if the native application descriptor is partial', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      assert(
        await doesThrow(
          api.hasJsApiImplBranchInContainer,
          api,
          NativeApplicationDescriptor.fromString('test:android'),
          PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
        )
      )
    })

    it('should return false if there is not git branch for the js api impl', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      const result = await api.hasJsApiImplBranchInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      expect(result).false
    })

    it('should return true if there is a git branch for the js api impl', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi({ cauldronDocument: tmpFixture })
      await api.addJsApiImplBranchToContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      const result = await api.hasJsApiImplBranchInContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/foo/JsApiImpl.git#master')
      )
      expect(result).true
    })
  })

  // ==========================================================
  // getConfigFilePath
  // ==========================================================
  describe('getConfigFilePath', () => {
    it('should return default config path if no descriptor is provided', () => {
      const cauldron = cauldronApi()
      const filePath = cauldron.getConfigFilePath()
      expect(filePath).eql('config/default.json')
    })

    it('should return native application config path', () => {
      const cauldron = cauldronApi()
      const descriptor = NativeApplicationDescriptor.fromString('test')
      const filePath = cauldron.getConfigFilePath(descriptor)
      expect(filePath).eql('config/test.json')
    })

    it('should return native application platform config path', () => {
      const cauldron = cauldronApi()
      const descriptor = NativeApplicationDescriptor.fromString('test:android')
      const filePath = cauldron.getConfigFilePath(descriptor)
      expect(filePath).eql('config/test-android.json')
    })

    it('should return native application version config path', () => {
      const cauldron = cauldronApi()
      const descriptor = NativeApplicationDescriptor.fromString(
        'test:android:19.0.0'
      )
      const filePath = cauldron.getConfigFilePath(descriptor)
      expect(filePath).eql('config/test-android-19.0.0.json')
    })
  })

  // ==========================================================
  // emptyContainer
  // ==========================================================
  describe('emptyContainer', () => {
    it('should throw if provided a partial native application desscriptor', async () => {
      const cauldron = cauldronApi()
      assert(
        await doesThrow(
          cauldron.emptyContainer,
          cauldron,
          NativeApplicationDescriptor.fromString('test:android')
        )
      )
    })

    it('should remove all MiniApps from Container of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture })
      await cauldron.emptyContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version.container.miniApps).empty
    })

    it('should remove all JS API Implementations from Container of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture })
      await cauldron.emptyContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version.container.jsApiImpls).empty
    })

    it('should remove all native dependencies from Container of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture })
      await cauldron.emptyContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version.container.nativeDeps).empty
    })

    it('should remove the Container yarn lock of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture })
      await cauldron.emptyContainer(
        NativeApplicationDescriptor.fromString('test:android:17.7.0')
      )
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'
      )[0]
      expect(version.yarnLocks.container).undefined
    })
  })

  // ==========================================================
  // throwIfPartialNapDescriptor
  // ==========================================================
  describe('throwIfPartialNapDescriptor', () => {
    it('should throw if provided a partial native application descriptor [1]', () => {
      expect(() => {
        cauldronApi().throwIfPartialNapDescriptor(
          NativeApplicationDescriptor.fromString('test')
        )
      }).to.throw()
    })

    it('should throw if provided a partial native application descriptor [2]', () => {
      expect(() => {
        cauldronApi().throwIfPartialNapDescriptor(
          NativeApplicationDescriptor.fromString('test:android')
        )
      }).to.throw()
    })

    it('should not throw if provided a complete native application descriptor', () => {
      expect(() => {
        cauldronApi().throwIfPartialNapDescriptor(
          NativeApplicationDescriptor.fromString('test:android:17.70')
        )
      }).to.not.throw()
    })
  })
})

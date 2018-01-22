// @flow

import {
  assert,
  expect
} from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import {
  PackagePath
} from 'ern-core'
import {
  beforeTest,
  doesThrow,
  afterTest,
  fixtures
} from 'ern-util-dev'
import type {
  CauldronCodePushEntry
} from '../src/FlowTypes'
import CauldronApi from '../src/CauldronApi'
import EphemeralFileStore from '../src/EphemeralFileStore'
import InMemoryDocumentStore from '../src/InMemoryDocumentStore'
import jp from 'jsonpath'
const sandbox = sinon.createSandbox()

const codePushNewEntryFixture : CauldronCodePushEntry = {
  "metadata": {
    "deploymentName": "QA",
    "isMandatory": true,
    "appVersion": "17.7",
    "size": 522938,
    "releaseMethod": "Upload",
    "label": "v18",
    "releasedBy": "test@gmail.com",
    "rollout": 100
  },
  "miniapps": [
    "@test/react-native-foo@4.0.4",
    "react-native-bar@2.0.2"
  ],
  "jsApiImpls": [
    "react-native-test-js-api-impl@1.0.0"
  ]
}

let gitStoreStub
let documentStore
let yarnLockStore

function cauldronApi(cauldronDocument) {
  cauldronDocument = cauldronDocument || getCauldronFixtureClone()
  documentStore = new InMemoryDocumentStore(cauldronDocument)
  const sourceMapStore = new EphemeralFileStore()
  yarnLockStore = new EphemeralFileStore()
  return new CauldronApi(documentStore, sourceMapStore, yarnLockStore)
}

function getCauldronFixtureClone() {
  return JSON.parse(JSON.stringify(fixtures.defaultCauldron))
}

describe('CauldronApi.js', () => {

  beforeEach(() => {
    beforeTest()
  })

  afterEach(() => {
    afterTest()
    sandbox.restore()
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
      expect(schemaVersion).eql('1.0.0')
    })

    it('should return 0.0.0 if schemaVersion property is missing', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      delete tmpFixture['schemaVersion']
      const schemaVersion = await cauldronApi(tmpFixture).getCauldronSchemaVersion()
      expect(schemaVersion).eql('0.0.0')
    })
  })

  // ==========================================================
  // beginTransaction
  // ========================================================== 
  describe('beginTransaction', () => {
    it('should call beginTransaction on the document store', async () => {
      const api = cauldronApi()
      const beginTransactionStub = sandbox.stub(documentStore, 'beginTransaction')
      await api.beginTransaction()
      sinon.assert.calledOnce(beginTransactionStub)
    })

    it('should call beginTransaction on the yarn lock store', async () => {
      const api = cauldronApi()
      const beginTransactionStub = sandbox.stub(yarnLockStore, 'beginTransaction')
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
      const discardTransactionStub = sandbox.stub(documentStore, 'discardTransaction')
      await api.discardTransaction()
      sinon.assert.calledOnce(discardTransactionStub)
    })

    it('should call discardTransaction on the yarn lock store', async () => {
      const api = cauldronApi()
      const discardTransactionStub = sandbox.stub(yarnLockStore, 'discardTransaction')
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
      const commitTransactionStub = sandbox.stub(documentStore, 'commitTransaction')
      await api.commitTransaction('commit-message')
      sinon.assert.calledOnce(commitTransactionStub)
    })

    it('should call commitTransaction on the document store with the right commit message', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(documentStore, 'commitTransaction')
      await api.commitTransaction('commit-message')
      sinon.assert.calledWith(commitTransactionStub, 'commit-message')
    })

    it('should call commitTransaction on the yarn lock store ', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(yarnLockStore, 'commitTransaction')
      await api.commitTransaction('commit-message')
      sinon.assert.calledOnce(commitTransactionStub)
    })

    it('should call commitTransaction on the yarn lock store with the right commit message', async () => {
      const api = cauldronApi()
      const commitTransactionStub = sandbox.stub(yarnLockStore, 'commitTransaction')
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
      const nativeApp = await cauldronApi().getNativeApplication('test')
      const nativeAppsObj = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")]')[0]
      expect(nativeApp).eql(nativeAppsObj)
    })

    it('should return undefined if application name is not found', async () => {
      const nativeApp = await cauldronApi().getNativeApplication('unexisting')
      expect(nativeApp).undefined
    })
  })

  // ==========================================================
  // getPlatforms
  // ========================================================== 
  describe('getPlatforms', () => {
    it ('should return the platforms array', async () => {
      const platforms = await cauldronApi().getPlatforms('test')
      expect(platforms).to.be.an('array').of.length(1)
    })

    it('should return undefined if no platforms are present', async () => {
      const platforms = await cauldronApi().getPlatforms('unexisting')
      expect(platforms).undefined
    })
  })

  // ==========================================================
  // getPlatform
  // ========================================================== 
  describe('getPlatform', () => {
    it('should return the platform object given its name', async () => {
      const platformObj = await cauldronApi().getPlatform('test', 'android')
      const platform = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]')[0]
      expect(platform).eql(platformObj)
    })

    it('should return undefined if the platform is not found', async () => {
      const platform = await cauldronApi().getPlatform('test', 'ios')
      expect(platform).undefined
    })

    it('should return undefined if the native application is not found', async () => {
      const platform = await cauldronApi().getPlatform('unexisting', 'android')
      expect(platform).undefined
    })
  })

  // ==========================================================
  // getVersions
  // ========================================================== 
  describe('getVersions', () => {
    it('should return the versions array', async () => {
      const versionsArr = await cauldronApi().getVersions('test', 'android')
      const versions = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions')[0]
      expect(versionsArr).eql(versions)
    })

    it('should return undefined if the native application platform does not exist', async () => {
      const versionsArr = await cauldronApi().getVersions('test', 'ios')
      expect(versionsArr).undefined
    })

    it('should return undefined if the native application name does not exist', async () => {
      const versionsArr = await cauldronApi().getVersions('unexisting', 'android')
      expect(versionsArr).undefined
    })
  })

  // ==========================================================
  // getVersion
  // ========================================================== 
  describe('getVersion', () => {
    it('should return the version object', async () => {
      const versionObj = await cauldronApi().getVersion('test', 'android', '17.7.0')
      const version = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]')[0]
      expect(versionObj).eql(version)
    })

    it('should return undefined if the native application version does not exist', async () => {
      const versionObj = await cauldronApi().getVersion('test', 'android', '0.1.0')
      expect(versionObj).undefined
    })

    it('should return undefined if the native application platform does not exist', async () => {
      const versionObj = await cauldronApi().getVersion('test', 'ios', '17.7.0')
      expect(versionObj).undefined
    })

    it('should return undefined if the native application name does not exist', async () => {
      const versionObj = await cauldronApi().getVersion('unexisting', 'android', '17.7.0')
      expect(versionObj).undefined
    })
  })

  // ==========================================================
  // getCodePushEntries
  // ==========================================================
  describe('getCodePushEntries', () => {
    it('should return the code push Production entries', async () => {
      const entries = await cauldronApi().getCodePushEntries('test', 'android', '17.7.0', 'Production')
      expect(entries).to.be.an('array').of.length(2)
    })

    it('should return the code push QA entries', async () => {
      const entries = await cauldronApi().getCodePushEntries('test', 'android', '17.7.0', 'QA')
      expect(entries).to.be.an('array').of.length(1)
    })

    it('should return undefined if deployment name is not found', async () => {
      const entries = await cauldronApi().getCodePushEntries('test', 'android', '17.7.0', 'unexisting')
      expect(entries).undefined
    })

    it('should return undefined if native application version is not found', async () => {
      const entries = await cauldronApi().getCodePushEntries('test', 'android', '1.0.0', 'QA')
      expect(entries).undefined
    })

    it('should return undefined if native application platform does not exist', async () => {
      const entries = await cauldronApi().getCodePushEntries('test', 'unexisting', '17.7.0', 'QA')
      expect(entries).undefined
    })

    it('should return undefined if native application name does not exist', async () => {
      const entries = await cauldronApi().getCodePushEntries('unexisting', 'ios', '17.7.0', 'QA')
      expect(entries).undefined
    })
  })

  // ==========================================================
  // setCodePushEntries
  // ==========================================================
  describe('setCodePushEntries', () => {
    it('should set the code push entries', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).setCodePushEntries('test', 'android', '17.7.0', 'QA', [codePushNewEntryFixture])
      const codePushEntries = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["QA"]')[0]
      expect(codePushEntries).eql([codePushNewEntryFixture])
    })

    it('should throw if the native application version does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.setCodePushEntries, api, 'test', 'android', '17.20.0', 'QA', [codePushNewEntryFixture]))
    })
  })

  // ==========================================================
  // getContainerMiniApps
  // ==========================================================
  describe('getContainerMiniApps', () => {
    it('should return the MiniApps array of a native application version Container', async () => {
      const containerMiniApps = await cauldronApi().getContainerMiniApps('test', 'android', '17.7.0')
      expect(containerMiniApps).to.be.an('array').of.length(2)
    })

    it('should return undefined if native application version does not exist', async () => {
      const containerMiniApps = await cauldronApi().getContainerMiniApps('test', 'android', '0.1.0')
      expect(containerMiniApps).undefined
    })

    it('should return undefined if native application platform does not exist', async () => {
      const containerMiniApps = await cauldronApi().getContainerMiniApps('test', 'unexisting', '17.7.0')
      expect(containerMiniApps).undefined
    })

    it('should return undefined if native application name does not exist', async () => {
      const containerMiniApps = await cauldronApi().getContainerMiniApps('unexisting', 'android', '17.7.0')
      expect(containerMiniApps).undefined
    })
  })

  // ==========================================================
  // getNativeDependencies
  // ==========================================================
  describe('getNativeDependencies', () => {
    it('should return the native dependencies of a native application version Container', async () => {
      const containerDependencies = await cauldronApi().getNativeDependencies('test', 'android', '17.7.0')
      expect(containerDependencies).to.be.an('array').of.length(4)
    })

    it('should return an empty array if native application version does not exist', async () => {
      const containerDependencies = await cauldronApi().getNativeDependencies('test', 'android', '0.1.0')
      expect(containerDependencies).to.be.an('array').empty
    })

    it('should return an empty array if native application platform does not exist', async () => {
      const containerDependencies = await cauldronApi().getNativeDependencies('test', 'unexisting', '17.7.0')
      expect(containerDependencies).to.be.an('array').empty
    })

    it('should return an empty array if native application name does not exist', async () => {
      const containerDependencies = await cauldronApi().getNativeDependencies('unexisting', 'android', '17.7.0')
      expect(containerDependencies).to.be.an('array').empty
    })
  })

  // ==========================================================
  // getJsApiImpls
  // ==========================================================
  describe('getJsApiImpls', () => {
    it('should throw an error if the native application version does not exist', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.getJsApiImpls, api, 'test', 'android', '17.10.0'))
    })

    it('should return the JavaScript API implementations package paths', async () => {
      const result = await cauldronApi().getJsApiImpls('test', 'android', '17.7.0')
      expect(result).to.be.an('array').of.length(1)
      expect(result[0]).eql('react-native-my-api-impl@1.0.0')
    })
  })

  // ==========================================================
  // getJsApiImpl
  // ==========================================================
  describe('getJsApiImpl', () => {
    it('should throw an error if the native application version does not exist', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.getJsApiImpl, api, 'test', 'android', '17.10.0', 'react-native-my-api-impl'))
    })

    it('should return the JavaScript API implementation package path [1]', async () => {
      const result = await cauldronApi().getJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl')
      expect(result).eql('react-native-my-api-impl@1.0.0')
    })

    it('should return the JavaScript API implementation package path [2]', async () => {
      const result = await cauldronApi().getJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl@1.0.0')
      expect(result).eql('react-native-my-api-impl@1.0.0')
    })
  })

  // ==========================================================
  // getNativeDependency
  // ==========================================================
  describe('getNativeDependency', () => {
    it('should return the native dependency string if no version is provided', async () => {
      const dependency = await cauldronApi().getNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge')
      expect(dependency).eql('react-native-electrode-bridge@1.4.9')
    })

    it('should return the native dependency string if version is provided', async () => {
      const dependency = await cauldronApi().getNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge@1.4.9')
      expect(dependency).eql('react-native-electrode-bridge@1.4.9')
    })

    it('should return undefined if incorrect version is provided', async () => {
      const dependency = await cauldronApi().getNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge@0.1.0')
      expect(dependency).undefined
    })

    it('should return undefined if dependency does not exist', async () => {
      const dependency = await cauldronApi().getNativeDependency('test', 'android', '17.7.0', 'unexisting')
      expect(dependency).undefined
    })

    it('should return undefined if native application version does not exist', async () => {
      const dependency = await cauldronApi().getNativeDependency('test', 'android', '0.1.0', 'react-native-electrode-bridge')
      expect(dependency).undefined
    })

    it('should return undefined if native application platform does not exist', async () => {
      const dependency = await cauldronApi().getNativeDependency('test', 'unexisting', '17.7.0', 'react-native-electrode-bridge')
      expect(dependency).undefined
    })

    it('should return undefined if native application name does not exist', async () => {
      const dependency = await cauldronApi().getNativeDependency('unexisting', 'android', '17.7.0', 'react-native-electrode-bridge')
      expect(dependency).undefined
    })
  })

  // ==========================================================
  // getConfig
  // ==========================================================
  describe('getConfig', () => {
    it('[get application version config] should return the native application version config', async () => {
      const configObj = await cauldronApi().getConfig({appName:'test', platformName:'android', versionName:'17.7.0'})
      const config = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].config')[0]
      expect(configObj).eql(config)
    })

    it('[get application version config] should return undefined if the native application version does not exist', async () => {
      const configObj = await cauldronApi().getConfig({appName:'test', platformName:'android', versionName:'17.7.1'})
      const config = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].config')[0]
      expect(configObj).undefined
    })

    it('[get application platform config] should return the native application platform config', async () => {
      const configObj = await cauldronApi().getConfig({appName:'test', platformName:'android'})
      const config = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].config')[0]
      expect(configObj).eql(config)
    })

    it('[get application platform config] should return undefined if the native application platform does not exist', async () => {
      const configObj = await cauldronApi().getConfig({appName:'test', platformName:'none', versionName:'17.7.0'})
      const config = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].config')[0]
      expect(configObj).undefined
    })

    it('[get application config] should return the native application name config', async () => {
      const configObj = await cauldronApi().getConfig({appName:'test'})
      const config = jp.query(fixtures.defaultCauldron, '$.nativeApps[?(@.name=="test")].config')[0]
      expect(configObj).eql(config)
    })

    it('[get application config] should return undefined if native application does not exist', async () => {
      const configObj = await cauldronApi().getConfig({appName:'unexisting'})
      expect(configObj).undefined
    })
  })

  // ==========================================================
  // clearCauldron
  // ==========================================================
  describe('clearCauldron', () => {
    it('should empty the Cauldron', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).clearCauldron()
      expect(tmpFixture.nativeApps).empty
    })
  })

  // ==========================================================
  // createNativeApplication
  // ==========================================================
  describe('createNativeApplication', () => {
    it('should create the native application object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).createNativeApplication({name: 'newapp'})
      const app = jp.query(tmpFixture, '$.nativeApps[?(@.name=="newapp")]')[0]
      expect(app).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createNativeApplication({name: 'newapp'})
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application name already exists', async() => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      assert(await doesThrow(api.createNativeApplication, api, {name: 'test'}))
    })
  })

  // ==========================================================
  // removeNativeApplication
  // ==========================================================
  describe('removeNativeApplication', () => {
    it('should remove the native application given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removeNativeApplication('test')
      const nativeApp = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")]')[0]
      expect(nativeApp).undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeNativeApplication('test')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the application name does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeNativeApplication, api, 'unexisting'))
    })
  })

  // ==========================================================
  // createPlatform
  // ==========================================================
  describe('createPlatform', () => {
    it('should create the platform object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).createPlatform('test', {name:'ios'})
      const platform = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="ios")]')[0]
      expect(platform).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createPlatform('test', {name:'ios'})
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the application platform already exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.createPlatform, api, 'test', {name:'android'}))
    })
  })

  // ==========================================================
  // removePlatform
  // ==========================================================
  describe('removePlatform', () => {
    it('should remove the native application platform given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removePlatform('test', 'android')
      const platform = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]')[0]
      expect(platform).undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removePlatform('test', 'android')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the application name does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removePlatform, api, 'unexisting', 'android'))
    })

    it('should throw if the application platform does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removePlatform, api, 'test', 'ios'))
    })
  })

  // ==========================================================
  // createVersion
  // ==========================================================
  describe('createVersion', () => {
    it('should create the version object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).createVersion('test', 'android', {name:'17.20.0', ernPlatformVersion:'1.0.0'})
      const version = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.20.0")]')[0]
      expect(version).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createVersion('test', 'android', {name:'17.20.0', ernPlatformVersion:'1.0.0'})
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the platform does not exist', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.createVersion, api, 'test', 'ios', {name:'17.20.0', ernPlatformVersion:'1.0.0'}))
    })

    it('should throw if the version already exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.createVersion, api, 'test', 'android', {name:'17.7.0', ernPlatformVersion:'1.0.0'}))
    })
  })

  // ==========================================================
  // removeVersion
  // ==========================================================
  describe('removeVersion', () => {
    it('should remove the native application version given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removeVersion('test', 'android', '17.7.0')
      const version = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]')[0]
      expect(version).undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeVersion('test', 'android', '17.7.0')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the platform name does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeVersion, api, 'test', 'unexisting'))
    })

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeVersion, api, 'test', 'android', '17.20.0'))
    })
  })

  // ==========================================================
  // updateVersion
  // ==========================================================
  describe('updateVersion', () => {
    it('should perform the update', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).updateVersion('test', 'android', '17.7.0', {isReleased: false})
      const version = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]')[0]
      expect(version.isReleased).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateVersion('test', 'android', '17.7.0', {isReleased: false})
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateVersion, api, 'test', 'android', '17.20.0', {isReleased: false}))
    })
  })

  // ==========================================================
  // removeNativeDependency
  // ==========================================================
  describe('removeNativeDependency', () => {
    it('should remove the native dependency', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removeNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge')
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps')[0]
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.4.9')).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the dependency is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeNativeDependency, api, 'test', 'android', '17.7.0', 'unexisting'))
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeNativeDependency, api, 'test', 'android', '17.20.0', 'react-native-electrode-bridge'))
    })
  })

  // ==========================================================
  // updateNativeDependency
  // ==========================================================
  describe('updateNativeDependency', () => {
    it('should update the native dependency', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).updateNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge', '1.5.0')
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps')[0]
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.4.9')).false
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.5.0')).true
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateNativeDependency('test', 'android', '17.7.0', 'react-native-electrode-bridge', '1.5.0')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the dependency is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateNativeDependency, api, 'test', 'android', '17.7.0', 'unexisting', '1.5.0'))
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateNativeDependency, api, 'test', 'android', '17.20.0', 'react-native-electrode-bridge', '1.5.0'))
    })
  })

  // ==========================================================
  // updateMiniAppVersion
  // ==========================================================
  describe('updateMiniAppVersion', () => {
    it('should update the MiniApp version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).updateMiniAppVersion('test', 'android', '17.7.0', PackagePath.fromString('react-native-bar@3.0.0'))
      const miniAppsArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps')[0]
      expect(miniAppsArr.includes('react-native-bar@3.0.0')).true
      expect(miniAppsArr.includes('react-native-bar@2.0.0')).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateMiniAppVersion('test', 'android', '17.7.0', PackagePath.fromString('react-native-bar@3.0.0'))
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the miniapp is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateMiniAppVersion, api, 'test', 'android', '17.7.0',  PackagePath.fromString('react-native-foo@3.0.0')))
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateMiniAppVersion, api, 'test', 'android', '17.20.0',  PackagePath.fromString('react-native-bar@3.0.0')))
    })
  })

  // ==========================================================
  // updateTopLevelContainerVersion
  // ==========================================================
  describe('updateTopLevelContainerVersion', () => {
    it('should update the top level container version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).updateTopLevelContainerVersion('test', 'android', '2.0.0')
      const topLevelContainerVersion = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].config.containerGenerator.containerVersion')[0]
      expect(topLevelContainerVersion).eql('2.0.0')
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateTopLevelContainerVersion('test', 'android', '2.0.0')
      sinon.assert.calledOnce(commitStub)
    })
  })

  // ==========================================================
  // updateContainerVersion
  // ==========================================================
  describe('updateContainerVersion', () => {
    it('should update the container version of the given native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).updateContainerVersion('test', 'android', '17.7.0', '2.0.0')
      const topLevelContainerVersion = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].containerVersion')[0]
      expect(topLevelContainerVersion).eql('2.0.0')
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateContainerVersion('test', 'android', '17.7.0', '2.0.0')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateContainerVersion, api, 'test', 'android', '17.20.0', '2.0.0'))
    })
  })

  // ==========================================================
  // getTopLevelContainerVersion
  // ==========================================================
  describe('getTopLevelContainerVersion', () => {
    it('should return the top level container version', async () => {
      const result = await cauldronApi().getTopLevelContainerVersion('test', 'android')
      expect(result).eql('1.16.44')
    })
  })

  // ==========================================================
  // getContainerVersion
  // ==========================================================
  describe('getContainerVersion', () => {
    it('should return the container version of the given native application version', async () => {
      const result = await cauldronApi().getContainerVersion('test', 'android', '17.7.0')
      expect(result).eql('1.16.44')
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.getContainerVersion, api, 'test', 'android', '17.20.0'))
    })
  })

  // ==========================================================
  // removeContainerMiniApp
  // ==========================================================
  describe('removeContainerMiniApp', () => {
    it('should remove the MiniApp from the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removeContainerMiniApp('test', 'android', '17.7.0', 'react-native-bar')
      const miniAppsArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps')[0]
      expect(miniAppsArr.includes('react-native-bare@2.0.0')).false
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeContainerMiniApp('test', 'android', '17.7.0', 'react-native-bar')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the MiniApp is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeContainerMiniApp, api, 'test', 'android', '17.7.0', 'unexisting'))
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeContainerMiniApp, api, 'test', 'android', '17.20.0', 'react-native-bar'))
    })
  })

  // ==========================================================
  // addContainerMiniApp
  // ==========================================================
  describe('addContainerMiniApp', () => {
    it('should add the MiniApp to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).addContainerMiniApp('test', 'android', '17.7.0', PackagePath.fromString('newMiniApp@1.0.0'))
      const miniAppsArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps')[0]
      expect(miniAppsArr.includes('newMiniApp@1.0.0')).true
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addContainerMiniApp('test', 'android', '17.7.0', PackagePath.fromString('newMiniApp@1.0.0'))
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the MiniApp already exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addContainerMiniApp, api, 'test', 'android', '17.7.0', PackagePath.fromString('react-native-bar@2.0.0')))
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addContainerMiniApp, api, 'test', 'android', '17.20.0', PackagePath.fromString('newMiniApp@1.0.0')))
    })
  })

  // ==========================================================
  // createNativeDependency
  // ==========================================================
  describe('createNativeDependency', () => {
    it('should add the native dependency to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).createNativeDependency('test', 'android', '17.7.0', PackagePath.fromString('testDep@1.0.0'))
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps')[0]
      expect(dependenciesArr.includes('testDep@1.0.0')).true
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.createNativeDependency('test', 'android', '17.7.0', PackagePath.fromString('testDep@1.0.0'))
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the dependency already exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.createNativeDependency, api, 'test', 'android', '17.7.0', PackagePath.fromString('react-native-electrode-bridge@1.4.9')))
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.createNativeDependency, api, 'test', 'android', '17.20.0', PackagePath.fromString('testDep@1.0.0')))
    })
  })

  // ==========================================================
  // addJsApiImpl
  // ==========================================================
  describe('addJsApiImpl', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addJsApiImpl, api, 'test', 'android', '17.20.0', PackagePath.fromString('react-native-new-js-api-impl@1.0.0')))
    })

    it('should throw if the js api impl already exists', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addJsApiImpl, api, 'test', 'android', '17.7.0', PackagePath.fromString('react-native-my-api-impl@1.0.0')))
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addJsApiImpl('test', 'android', '17.7.0', PackagePath.fromString('react-native-new-js-api-impl@1.0.0'))
      sinon.assert.calledOnce(commitStub)
    })

    it('should add the JS API impl to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).addJsApiImpl('test', 'android', '17.7.0', PackagePath.fromString('react-native-new-js-api-impl@1.0.0'))
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls')[0]
      expect(dependenciesArr.includes('react-native-new-js-api-impl@1.0.0')).true
    })
  })

  // ==========================================================
  // removeJsApiImpl
  // ==========================================================
  describe('removeJsApiImpl', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeJsApiImpl, api, 'test', 'android', '17.20.0', 'react-native-my-api-impl@1.0.0'))
    })

    it('should throw if the js api impl is not found [1]', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeJsApiImpl, api, 'test', 'android', '17.7.0', 'react-native-unknown-api-impl'))
    })

    it('should throw if the js api impl is not found [2]', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeJsApiImpl, api, 'test', 'android', '17.7.0', 'react-native-unknown-api-impl@1.0.0'))
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.removeJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl@1.0.0')
      sinon.assert.calledOnce(commitStub)
    })

    it('should remove the JS API impl from the container of the native application version [1]', async() => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removeJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl')
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls')[0]
      expect(dependenciesArr).not.includes('react-native-my-api-impl@1.0.0')
    })

    it('should remove the JS API impl from the container of the native application version [2]', async() => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).removeJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl@1.0.0')
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls')[0]
      expect(dependenciesArr).not.includes('react-native-my-api-impl@1.0.0')
    })
  })

  // ==========================================================
  // updateJsApiImpl
  // ==========================================================
  describe('updateJsApiImpl', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateJsApiImpl, api, 'test', 'android', '17.20.0', 'react-native-my-api-impl', '2.0.0'))
    })

    it('should throw if the js api impl is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateJsApiImpl, api, 'test', 'android', '17.7.0', 'react-native-unknown-api-impl', '1.0.0'))
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.updateJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl', '2.0.0')
      sinon.assert.calledOnce(commitStub)
    })

    it('should update the JS API impl version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).updateJsApiImpl('test', 'android', '17.7.0', 'react-native-my-api-impl', '2.0.0')
      const dependenciesArr = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls')[0]
      expect(dependenciesArr).includes('react-native-my-api-impl@2.0.0')
    })
  })

  // ==========================================================
  // addCodePushEntry
  // ==========================================================
  describe('addCodePushEntry', () => {
    it('should add the code push entry to QA', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).addCodePushEntry('test', 'android', '17.7.0', codePushNewEntryFixture)
      const entries = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["QA"]')[0]
      expect(entries).to.be.an('array').of.length(2)
    })

    it('should add the code push entry to new deployment name', async () => {
      let modifiedCodePushEntryFixture = Object.assign({}, codePushNewEntryFixture)
      modifiedCodePushEntryFixture.metadata.deploymentName = 'STAGING'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).addCodePushEntry('test', 'android', '17.7.0', modifiedCodePushEntryFixture)
      const entries = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["STAGING"]')[0]
      expect(entries).to.be.an('array').of.length(1)
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addCodePushEntry('test', 'android', '17.7.0', codePushNewEntryFixture)
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addCodePushEntry, api, 'test', 'android', '17.20.0',codePushNewEntryFixture))
    })
  })

  // ==========================================================
  // hasYarnLock
  // ==========================================================
  describe('hasYarnLock', () => {
    it('should return true if the native application version has the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock('test', 'android', '17.7.0', 'Production')
      expect(hasYarnLock).to.be.true
    })

    it('should return false if the native application version does not have the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock('test', 'android', '17.7.0', 'UnexistingKey')
      expect(hasYarnLock).to.be.false
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.hasYarnLock, api, 'test', 'android', '17.20.0', 'Production'))
    })
  })

  // ==========================================================
  // addYarnLock
  // ==========================================================
  describe('addYarnLock', () => {
    it('should properly add the yarn lock', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).addYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      const entry = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["YARN_LOCK_KEY"]')[0]
      expect(entry).not.undefined
    })

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.addYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.addYarnLock, api, 'test', 'android', '17.20.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT'))
    })
  })

  // ==========================================================
  // getYarnLockId
  // ==========================================================
  describe('getYarnLockId', () => {
    it('should properly return the yarn lock id if it exists', async () => {
      const id = await cauldronApi().getYarnLockId('test', 'android', '17.7.0', 'Production')
      expect(id).eql('91bf4eff61586d71fe5d52e31a2cfabcbb31e33e')
    })

    it('should return undefined if the yarn lock key does not exists', async () => {
      const id = await cauldronApi().getYarnLockId('test', 'android', '17.7.0', 'UnknownKey')
      expect(id).undefined
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.getYarnLockId, api, 'test', 'android', '17.20.0', 'Production'))
    })
  })

  // ==========================================================
  // setYarnLockId
  // ==========================================================
  describe('setYarnLockId', () => {
    it('should properly set the yarn lock id of an existing key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).setYarnLockId('test', 'android', '17.7.0', 'Production', newId)
      const entry = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["Production"]')[0]
      expect(entry).eql(newId)
    })

    it('should properly set the yarn lock id of an unexisting key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).setYarnLockId('test', 'android', '17.7.0', 'NewKey', newId)
      const entry = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["NewKey"]')[0]
      expect(entry).eql(newId)
    })

    it('should commit the document store', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.setYarnLockId('test', 'android', '17.7.0', 'NewKey', newId)
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      assert(await doesThrow(api.setYarnLockId, api, 'test', 'android', '17.20.0', 'NewKey', newId))
    })
  })

  // ==========================================================
  // getYarnLock
  // ==========================================================
  describe('getYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      assert(await doesThrow(api.getYarnLock, api, 'test', 'android', '17.20.0', 'Production'))
    })
  })

  // ==========================================================
  // getPathToYarnLock
  // ==========================================================
  describe('getPathToYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.getPathToYarnLock, api, 'test', 'android', '17.20.0', 'Production'))
    })
  })

  // ==========================================================
  // removeYarnLock
  // ==========================================================
  describe('removeYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.removeYarnLock, api, 'test', 'android', '17.20.0', 'Production'))
    })
  })

  // ==========================================================
  // updateYarnLock
  // ==========================================================
  describe('updateYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.updateYarnLock, api, 'test', 'android', '17.20.0', 'Production', 'NewLock'))
    })
  })

  // ==========================================================
  // updateYarnLockId
  // ==========================================================
  describe('updateYarnLockId', () => {
    it('should properly update the yarn lock id of an existing key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      await api.updateYarnLockId('test', 'android', '17.7.0', 'Production', newId)
      const id = await api.getYarnLockId('test', 'android', '17.7.0', 'Production')
      expect(id).eql(newId)
    })

    it('should properly set the yarn lock id of an unexisting key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      await api.updateYarnLockId('test', 'android', '17.7.0', 'NewKey', newId)
      const id = await api.getYarnLockId('test', 'android', '17.7.0', 'NewKey')
      expect(id).eql(newId)
    })

    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      assert(await doesThrow(api.updateYarnLockId, api, 'test', 'android', '17.20.0', 'NewKey'))
    })
  })

  // ==========================================================
  // setYarnLocks
  // ==========================================================
  describe('setYarnLocks', () => {
    it('should set the yarn locks', async () => {
      const yarnLocks = { test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' }
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      await cauldronApi(tmpFixture).setYarnLocks('test', 'android', '17.7.0', yarnLocks)
      const yarnLocksObj = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks')[0]
      expect(yarnLocksObj).eql(yarnLocks)
    })

    it('should commit the document store', async () => {
      const yarnLocks = { test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' }
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron))
      const api = cauldronApi(tmpFixture)
      const commitStub = sandbox.stub(documentStore, 'commit')
      await api.setYarnLocks('test', 'android', '17.7.0', yarnLocks)
      sinon.assert.calledOnce(commitStub)
    })

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi()
      assert(await doesThrow(api.setYarnLocks, api, 'test', 'android', '17.20.0', {"Test":"30bf4eff61586d71fe5d52e31a2cfabcbb31e33e"}))
    })
  })
})
import {
  assert,
  expect
} from 'chai'
import CauldronHelper from '../src/CauldronHelper'
import sinon from 'sinon'
import { 
  Dependency,
  NativeApplicationDescriptor
} from 'ern-util'
import { 
  CauldronApi,
  EphemeralFileStore,
  InMemoryDocumentStore
} from 'ern-cauldron-api'
import jp from 'jsonpath'

const cauldronFixture = require('./fixtures/cauldron-fixture.json')

const codePushEntryFixtureOne =  {
  metadata: {
    deploymentName: "Production",
    isMandatory: false,
    appVersion: "17.7",
    size: 522946,
    releaseMethod: "Upload",
    label: "v18",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
  },
  miniapps: [
    "code-push-test-miniapp@0.0.19"
  ]
}

const codePushEntryFixtureTwo = {
  metadata: {
    deploymentName: "Production",
    isMandatory: false,
    appVersion: "17.7",
    size: 522946,
    releaseMethod: "Upload",
    label: "v19",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
  },
  miniapps: [
    "code-push-test-miniapp@0.0.20"
  ]
}

const codePushMetadataFixtureOne = {
    deploymentName: "Production",
    isMandatory: true,
    appVersion: "17.7",
    size: 522947,
    releaseMethod: "Upload",
    label: "v20",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
}

const codePushMetadataFixtureTwo = {
  deploymentName: "Staging",
  isMandatory: true,
  appVersion: "17.7",
  size: 522947,
  releaseMethod: "Upload",
  label: "v20",
  releasedBy: "lemaireb@gmail.com",
  rollout: 100
}

const miniAppsFixtureOne = [ Dependency.fromString('code-push-test-miniapp@0.0.22') ]

let cauldronHelper
let documentStore

function createCauldronHelper(cauldronDocument) {
  documentStore = new InMemoryDocumentStore(cauldronDocument)
 // const sourceMapStore = new EphemeralFileStore()
 // const yarnLockStore = new EphemeralFileStore()
  const cauldronApi = new CauldronApi(documentStore)//, sourceMapStore, yarnLockStore)
  return new CauldronHelper(cauldronApi)
}

function getCauldronFixtureClone() {
  return JSON.parse(JSON.stringify(cauldronFixture))
}

const testAndroid1770Path = '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]'

describe('CauldronHelper.js', () => {
   describe('_addCodePushEntry', () => {
    it('should properly apply the entriesLimit config [limit of 2 entries]', async () => {
      const fixture = getCauldronFixtureClone()
      fixture.config.codePush = { entriesLimit: 2 }
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(result).to.be.an('array').of.length(2)
        expect(result[1].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should properly apply the entriesLimit config [limit of 0 entries = unlimited entries]', async () => {
      const fixture = getCauldronFixtureClone()
      fixture.config.codePush = { entriesLimit: 0 }
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(result).to.be.an('array').of.length(3)
        expect(result[2].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is no entriesLimit config [unlimited entries]', async () => {
      const fixture = getCauldronFixtureClone()
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Production`)[0]
        expect(result).to.be.an('array').of.length(3)
        expect(result[2].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is no entriesLimit config [unlimited entries] with no current CodePush entry in Cauldron', async () => {
      const fixture = getCauldronFixtureClone()
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureTwo,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Staging`)[0]
        expect(result).to.be.an('array').of.length(1)
        expect(result[0].metadata).eql(codePushMetadataFixtureTwo)
    })

    it('should work if there is a entriesLimit config [limit of 2 entries] with no current CodePush entry in Cauldron', async () => {
      const fixture = getCauldronFixtureClone()
      fixture.config.codePush = { entriesLimit: 2 }
      const cauldronHelper = createCauldronHelper(fixture)
      await cauldronHelper._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:17.7.0'),
        codePushMetadataFixtureTwo,
        miniAppsFixtureOne)
        const result = jp.query(fixture, `${testAndroid1770Path}.codePush.Staging`)[0]
        expect(result).to.be.an('array').of.length(1)
        expect(result[0].metadata).eql(codePushMetadataFixtureTwo)
    })
  })
})
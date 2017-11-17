import {
  assert,
  expect
} from 'chai'
import {
  Cauldron
} from '../src/cauldron'
import sinon from 'sinon'
import { NativeApplicationDescriptor, Dependency } from '../../ern-util/dist/index';

const cauldronFixture = require('./fixtures/cauldron-fixture.json')

const codePushEntryFixtureOne =  {
  metadata: {
    deploymentName: "Staging",
    isMandatory: false,
    appVersion: "1.0",
    size: 522946,
    releaseMethod: "Upload",
    label: "v7",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
  },
  miniapps: [
    "code-push-test-miniapp@0.0.19"
  ]
}

const codePushEntryFixtureTwo = {
  metadata: {
    deploymentName: "Staging",
    isMandatory: false,
    appVersion: "1.0",
    size: 522946,
    releaseMethod: "Upload",
    label: "v8",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
  },
  miniapps: [
    "code-push-test-miniapp@0.0.20"
  ]
}

const codePushMetadataFixtureOne = {
    deploymentName: "Staging",
    isMandatory: true,
    appVersion: "1.0",
    size: 522947,
    releaseMethod: "Upload",
    label: "v9",
    releasedBy: "lemaireb@gmail.com",
    rollout: 100
}

const miniAppsFixtureOne = [ Dependency.fromString('code-push-test-miniapp@0.0.22') ]

let cauldronCliStub = sinon.createStubInstance(Cauldron)

describe('cauldron.js', () => {
  describe('_addCodePushEntry', () => {
    it('should properly apply the entriesLimit config [limit of 2 entries]', async () => {
      cauldronCliStub.getConfig = sinon.stub().resolves({codePush: { entriesLimit: 2}})
      cauldronCliStub.getCodePushEntries = sinon.stub().resolves([codePushEntryFixtureOne, codePushEntryFixtureTwo])
      cauldronCliStub.setCodePushEntries = sinon.stub().resolves()
      const cauldron = new Cauldron(cauldronCliStub)
      await cauldron._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:1.0.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const updatedEntriesArrArg = cauldronCliStub.setCodePushEntries.args[0][4]
        expect(updatedEntriesArrArg).to.be.an('array').of.length(2)
        expect(updatedEntriesArrArg[0]).eql(codePushEntryFixtureTwo)
        expect(updatedEntriesArrArg[1].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should properly apply the entriesLimit config [limit of 0 entries = unlimited entries]', async () => {
      cauldronCliStub.getConfig = sinon.stub().resolves({codePush: { entriesLimit: 0}})
      cauldronCliStub.getCodePushEntries = sinon.stub().resolves([codePushEntryFixtureOne, codePushEntryFixtureTwo])
      cauldronCliStub.setCodePushEntries = sinon.stub().resolves()
      const cauldron = new Cauldron(cauldronCliStub)
      await cauldron._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:1.0.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const updatedEntriesArrArg = cauldronCliStub.setCodePushEntries.args[0][4]
        expect(updatedEntriesArrArg).to.be.an('array').of.length(3)
        expect(updatedEntriesArrArg[0]).eql(codePushEntryFixtureOne)
        expect(updatedEntriesArrArg[2].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is no entriesLimit config [unlimited entries]', async () => {
      cauldronCliStub.getConfig = sinon.stub().resolves()
      cauldronCliStub.getCodePushEntries = sinon.stub().resolves([codePushEntryFixtureOne, codePushEntryFixtureTwo])
      cauldronCliStub.setCodePushEntries = sinon.stub().resolves()
      const cauldron = new Cauldron(cauldronCliStub)
      await cauldron._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:1.0.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const updatedEntriesArrArg = cauldronCliStub.setCodePushEntries.args[0][4]
        expect(updatedEntriesArrArg).to.be.an('array').of.length(3)
        expect(updatedEntriesArrArg[0]).eql(codePushEntryFixtureOne)
        expect(updatedEntriesArrArg[2].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is no entriesLimit config [unlimited entries] with no current CodePush entry in Cauldron', async () => {
      cauldronCliStub.getConfig = sinon.stub().resolves()
      cauldronCliStub.getCodePushEntries = sinon.stub().resolves()
      cauldronCliStub.setCodePushEntries = sinon.stub().resolves()
      const cauldron = new Cauldron(cauldronCliStub)
      await cauldron._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:1.0.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const updatedEntriesArrArg = cauldronCliStub.setCodePushEntries.args[0][4]
        expect(updatedEntriesArrArg).to.be.an('array').of.length(1)
        expect(updatedEntriesArrArg[0].metadata).eql(codePushMetadataFixtureOne)
    })

    it('should work if there is a entriesLimit config [limit of 2 entries] with no current CodePush entry in Cauldron', async () => {
      cauldronCliStub.getConfig = sinon.stub().resolves({codePush: { entriesLimit: 2}})
      cauldronCliStub.getCodePushEntries = sinon.stub().resolves()
      cauldronCliStub.setCodePushEntries = sinon.stub().resolves()
      const cauldron = new Cauldron(cauldronCliStub)
      await cauldron._addCodePushEntry(
        NativeApplicationDescriptor.fromString('test:android:1.0.0'),
        codePushMetadataFixtureOne,
        miniAppsFixtureOne)
        const updatedEntriesArrArg = cauldronCliStub.setCodePushEntries.args[0][4]
        expect(updatedEntriesArrArg).to.be.an('array').of.length(1)
        expect(updatedEntriesArrArg[0].metadata).eql(codePushMetadataFixtureOne)
    })
  })
})
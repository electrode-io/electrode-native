import {
  assert,
  expect
} from 'chai'
import sinon from 'sinon'
import fs from 'fs'

import CauldronApi from '../src/api'
import FileStore from '../src/filestore'
import GitStore from '../src/gitstore'

const cauldronFixture = require('./fixtures/cauldron-fixture.json')

const fileStoreSourceMapStub = sinon.createStubInstance(FileStore)
const fileStoreYarnLockStub = sinon.createStubInstance(FileStore)
fileStoreYarnLockStub.removeFile = sinon.stub().resolves(true)

const codePushNewEntryFixture = {
  "metadata": {
    "deploymentName": "QA",
    "isMandatory": true,
    "appVersion": "17.7",
    "size": 522938,
    "releaseMethod": "Upload",
    "label": "v18",
    "releasedBy": "test@gmail.com",
    "rollout": "100"
  },
  "miniapps": [
    "@test/react-native-foo@4.0.4",
    "react-native-bar@2.0.2"
  ]
}

let gitStoreStub
let api

describe('api.js', () => {
  beforeEach(() => {
    gitStoreStub = sinon.createStubInstance(GitStore)
    gitStoreStub.getCauldron = sinon.stub().resolves(JSON.parse(JSON.stringify(cauldronFixture)))
    gitStoreStub.commit = sinon.stub().resolves()
    api = new CauldronApi(gitStoreStub, fileStoreSourceMapStub, fileStoreYarnLockStub)
  })

  // ==========================================================
  // getCodePushEntries
  // ==========================================================
  describe('getCodePushEntries', () => {
    it('should return the code push entries', async () => {
      const entries = await api.getCodePushEntries('test', 'android', '17.7.0')
      expect(entries).to.be.an('array').of.length(3)
    })

    it('should return undefined if native application version is not found', async () => {
      const entries = await api.getCodePushEntries('test', 'android', '1.0.0')
      expect(entries).undefined
    })
  })

  // ==========================================================
  // addCodePushEntry
  // ==========================================================
  describe('addCodePushEntry', () => {
    it('should add the code push entry', async () => {
      await api.addCodePushEntry('test', 'android', '17.7.0', codePushNewEntryFixture)
      const entries = await api.getCodePushEntries('test', 'android', '17.7.0')
      expect(entries).to.be.an('array').of.length(4)
    })

    it('should return the code push entries', async () => {
      const entries = await api.getCodePushEntries('test', 'android', '17.7.0')
      expect(entries).to.be.an('array').of.length(3)
    })

    it('should commit the changes if code push entry was added', async () => {
      await api.addCodePushEntry('test', 'android', '17.7.0', codePushNewEntryFixture)
      sinon.assert.calledOnce(gitStoreStub.commit)
    })

    it('should not commit the changes if code push entry was not added', async () => {
      await api.addCodePushEntry('test', 'android', '1.0.0', codePushNewEntryFixture)
      sinon.assert.notCalled(gitStoreStub.commit)
    })
  })

  // ==========================================================
  // hasYarnLock
  // ==========================================================
  describe('hasYarnLock', () => {
    it('should return true if the native application version has the given yarn lock key', async () => {
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'Production')
      expect(hasYarnLock).to.be.true
    })

    it('should return false if the native application version does not have the given yarn lock key', async () => {
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'UnexistingKey')
      expect(hasYarnLock).to.be.false
    })

    it('should return false if the native application version does not exists', async () => {
      const hasYarnLock = await api.hasYarnLock('test', 'android', '1.0.0', 'UnexistingKey')
      expect(hasYarnLock).to.be.false
    })
  })

  // ==========================================================
  // addYarnLock
  // ==========================================================
  describe('addYarnLock', () => {
    it('should properly add the yarn lock', async () => {
      await api.addYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY')
      expect(hasYarnLock).to.be.true
    })

    it('should commit the changes if yarn lock was added', async () => {
      await api.addYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      sinon.assert.calledOnce(gitStoreStub.commit)
    })

    it('should not commit the changes if yarn lock was not added', async () => {
      await api.addYarnLock('test', 'android', '1.0.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      sinon.assert.notCalled(gitStoreStub.commit)
    })
  })

  // ==========================================================
  // removeYarnLock
  // ==========================================================
  describe('removeYarnLock', () => {
    it('should properly remove the yarn lock', async () => {
      await api.removeYarnLock('test', 'android', '17.7.0', 'Production')
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'Production')
      expect(hasYarnLock).to.be.false
    })

    it('should return true if the native application version has the given yarn lock key', async () => {
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'Production')
      expect(hasYarnLock).to.be.true
    })

    it('should commit the changes if the yarn lock was removed', async () => {
      await api.removeYarnLock('test', 'android', '17.7.0', 'Production')
      sinon.assert.calledOnce(gitStoreStub.commit)
    })

    it('should not commit the changes if the yarn lock was not removed', async () => {
      await api.removeYarnLock('test', 'android', '1.0.0', 'Production')
      sinon.assert.notCalled(gitStoreStub.commit)
    })
  })
})
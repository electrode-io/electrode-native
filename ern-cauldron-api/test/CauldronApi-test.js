import {
  assert,
  expect
} from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import {
  fixtures
} from 'ern-util-dev'
import CauldronApi from '../src/CauldronApi'
import EphemeralFileStore from '../src/EphemeralFileStore'
import InMemoryDocumentStore from '../src/InMemoryDocumentStore'

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
let fileStoreYarnLockStub
let cauldronData

function cauldronApi(cauldronDocument) {
  cauldronDocument = cauldronDocument || getCauldronFixtureClone()
  const documentStore = new InMemoryDocumentStore(cauldronDocument)
  const sourceMapStore = new EphemeralFileStore()
  const yarnLockStore = new EphemeralFileStore()
  return new CauldronApi(documentStore, sourceMapStore, yarnLockStore)
}

function getCauldronFixtureClone() {
  return JSON.parse(JSON.stringify(fixtures.defaultCauldron))
}

describe('CauldronApi.js', () => {
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

    it('should return undefined if native application version is not found', async () => {
      const entries = await cauldronApi().getCodePushEntries('test', 'android', '1.0.0')
      expect(entries).undefined
    })
  })

  // ==========================================================
  // addCodePushEntry
  // ==========================================================
  describe('addCodePushEntry', () => {
    it('should add the code push entry to QA', async () => {
      const api = cauldronApi()
      await api.addCodePushEntry('test', 'android', '17.7.0', codePushNewEntryFixture)
      const entries = await api.getCodePushEntries('test', 'android', '17.7.0', 'QA')
      expect(entries).to.be.an('array').of.length(2)
    })

    it('should add the code push entry to new deployment name', async () => {
      let modifiedCodePushEntryFixture = Object.assign({}, codePushNewEntryFixture)
      modifiedCodePushEntryFixture.metadata.deploymentName = 'STAGING'
      const api = cauldronApi()
      await api.addCodePushEntry('test', 'android', '17.7.0', modifiedCodePushEntryFixture)
      const entries = await api.getCodePushEntries('test', 'android', '17.7.0', 'STAGING')
      expect(entries).to.be.an('array').of.length(1)
    })

    /*it('should commit the changes if code push entry was added', async () => {
      await cauldronApi().addCodePushEntry('test', 'android', '17.7.0', codePushNewEntryFixture)
      sinon.assert.calledOnce(gitStoreStub.commit)
    })

    it('should not commit the changes if code push entry was not added', async () => {
      await cauldronApi().addCodePushEntry('test', 'android', '1.0.0', codePushNewEntryFixture)
      sinon.assert.notCalled(gitStoreStub.commit)
    })*/
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

    it('should return false if the native application version does not exists', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock('test', 'android', '1.0.0', 'UnexistingKey')
      expect(hasYarnLock).to.be.false
    })
  })

  // ==========================================================
  // addYarnLock
  // ==========================================================
  describe('addYarnLock', () => {
    it('should properly add the yarn lock', async () => {
      const api = cauldronApi()
      await api.addYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY')
      expect(hasYarnLock).to.be.true
    })

    /*it('should commit the changes if yarn lock was added', async () => {
      await cauldronApi().addYarnLock('test', 'android', '17.7.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      sinon.assert.calledOnce(gitStoreStub.commit)
    })

    it('should not commit the changes if yarn lock was not added', async () => {
      await cauldronApi().addYarnLock('test', 'android', '1.0.0', 'YARN_LOCK_KEY', 'YARN_LOCK_CONTENT')
      sinon.assert.notCalled(gitStoreStub.commit)
    })*/
  })

  // ==========================================================
  // removeYarnLock
  // ==========================================================
  describe('removeYarnLock', () => {
    /*it('should properly remove the yarn lock', async () => {
      const api = cauldronApi()
      await api.removeYarnLock('test', 'android', '17.7.0', 'Production')
      const hasYarnLock = await api.hasYarnLock('test', 'android', '17.7.0', 'Production')
      expect(hasYarnLock).to.be.false
    })*/

    it('should return true if the native application version has the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock('test', 'android', '17.7.0', 'Production')
      expect(hasYarnLock).to.be.true
    })

    /*it('should commit the changes if the yarn lock was removed', async () => {
      await cauldronApi().removeYarnLock('test', 'android', '17.7.0', 'Production')
      sinon.assert.calledOnce(gitStoreStub.commit)
    })

    it('should not commit the changes if the yarn lock was not removed', async () => {
      await cauldronApi().removeYarnLock('test', 'android', '1.0.0', 'Production')
      sinon.assert.notCalled(gitStoreStub.commit)
    })*/
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

    it('should return undefined if the native app version does not exists', async () => {
      const id = await cauldronApi().getYarnLockId('test', 'android', '17.1000.0', 'Production')
      expect(id).undefined
    })
  })

  // ==========================================================
  // setYarnLockId
  // ==========================================================
  describe('setYarnLockId', () => {
    it('should properly set the yarn lock id of an existing key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      await api.setYarnLockId('test', 'android', '17.7.0', 'Production', newId)
      const id = await api.getYarnLockId('test', 'android', '17.7.0', 'Production')
      expect(id).eql(newId)
    })

    it('should properly set the yarn lock id of an unexisting key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e'
      const api = cauldronApi()
      await api.setYarnLockId('test', 'android', '17.7.0', 'NewKey', newId)
      const id = await api.getYarnLockId('test', 'android', '17.7.0', 'NewKey')
      expect(id).eql(newId)
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
  })
})
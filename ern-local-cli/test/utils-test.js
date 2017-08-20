import {
  assert,
  expect
} from 'chai'
import {
  cauldron
} from 'ern-core'
import {
  NativeApplicationDescriptor
} from 'ern-util'
import * as publication from '../src/lib/publication'
import sinon from 'sinon'
import utils from '../src/lib/utils'
import * as fixtures from './fixtures/common'

// Fixtures
const basicCauldronFixture = require('./fixtures/cauldron.json')
const emptyCauldronFixture = require('./fixtures/empty-cauldron.json')

// Cauldron stubs
const getAllNativeAppsStub = sinon.stub(cauldron, 'getAllNativeApps')
const beginTransactionStub = sinon.stub(cauldron, 'beginTransaction')
const commitTransactionStub = sinon.stub(cauldron, 'commitTransaction')
const discardTransactionStub = sinon.stub(cauldron, 'discardTransaction')
const getContainerVersionStub = sinon.stub(cauldron, 'getContainerVersion').resolves('1.2.3')
const updateContainerVersionStub = sinon.stub(cauldron, 'updateContainerVersion')

// Logging stubs
const logErrorStub = sinon.stub()
const logInfoStub = sinon.stub()

// Other stubs
const runCauldronContainerGenStub = sinon.stub(publication, 'runCauldronContainerGen')
const processExitStub = sinon.stub(process, 'exit')

global.log = {
  error: logErrorStub,
  info: logInfoStub
}

// Before each test
beforeEach(() => {
  // Reset the state of all stubs/spies
  processExitStub.reset()
  logErrorStub.reset()
  logInfoStub.reset()
  runCauldronContainerGenStub.reset()
  beginTransactionStub.reset()
  commitTransactionStub.reset()
  discardTransactionStub.reset()
  updateContainerVersionStub.reset()
})

function useCauldronFixture(fixture) {
  getAllNativeAppsStub.resolves(fixture.nativeApps)
}

after(() => {
  getAllNativeAppsStub.restore()
  processExitStub.restore()
  runCauldronContainerGenStub.restore()
  beginTransactionStub.restore()
  commitTransactionStub.restore()
  discardTransactionStub.restore()
  getContainerVersionStub.restore()
  updateContainerVersionStub.restore()
})

describe('utils.js', () => {
  // ==========================================================
  // getNapDescriptorStringsFromCauldron
  // ==========================================================
  describe('getNapDescriptorStringsFromCauldron', () => {
    it('should return an empty array if no match', async () => {
      useCauldronFixture(emptyCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron()
      expect(result).to.be.an.empty.array
    })

    it('should return all native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron()
      expect(result).to.have.lengthOf(5)
    })

    it('should return only released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true})
      expect(result).to.have.lengthOf(3)
    })

    it('should return only non released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyNonReleasedVersions: true})
      expect(result).to.have.lengthOf(2)
    })

    it('should return only android platform native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ platform: 'android'})
      expect(result).to.have.lengthOf(2)
    })

    it('should return only ios platform native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ platform: 'ios'})
      expect(result).to.have.lengthOf(3)
    })

    it('should return only android platform released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true, platform: 'android'})
      expect(result).to.have.lengthOf(1)
    })

    it('should return only android platform non released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyNonReleasedVersions: true, platform: 'android'})
      expect(result).to.have.lengthOf(1)
    })

    it('should return only ios platform released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true, platform: 'ios'})
      expect(result).to.have.lengthOf(2)
    })

    it('should return only ios platform non released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyNonReleasedVersions: true, platform: 'ios'})
      expect(result).to.have.lengthOf(1)
    })
  })

  // ==========================================================
  // logErrorAndExitIfNotSatisfied
  // ==========================================================
  function assertLoggedErrorAndExitedProcess() {
    sinon.assert.calledOnce(logErrorStub)
    sinon.assert.calledOnce(processExitStub)
    assert(logErrorStub.calledBefore(processExitStub))
  }

  function assertNoErrorLoggedAndNoProcessExit() {
    sinon.assert.notCalled(logErrorStub)
    sinon.assert.notCalled(processExitStub)
  }

  describe('logErrorAndExitIfNotSatisfied', () => {
    fixtures.invalidContainerVersions.forEach(version => {
      it('[isValidContainerVersion] Shoud log error and exit process for invalid container version', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: version
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.validContainerVersions.forEach(version => {
      it('[isValidContainerVersion] Should not log error nor exit process for valid container version', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: version
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.incompleteNapDescriptors.forEach(napDescriptor => {
      it('[isCompleteNapDescriptorString] Should log error and exit process for incomplete nap descriptor', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: napDescriptor
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.completeNapDescriptors.forEach(napDescriptor => {
      it('[isCompleteNapDescriptorString] Should not log error nor exit process for complete nap descriptor', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: napDescriptor
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(napDescriptor => {
      it('[noGitOrFilesystemPath] Should log error and exit process if path is/contains a git or file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: napDescriptor
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.withoutGitOrFileSystemPath.forEach(napDescriptor => {
      it('[noGitOrFilesystemPath] Should not log error not exit process if path is not/ does not contain a git or file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: napDescriptor
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })
  })

  // ==========================================================
  // performContainerStateUpdateInCauldron
  // ==========================================================
  describe('performContainerStateUpdateInCauldron', () => {
    const napDescriptor = NativeApplicationDescriptor.fromString('testapp:android:1.0.0')

    it('should uppdate container version with provided one', async () => {
      await utils.performContainerStateUpdateInCauldron(() => Promise.resolve(true), 
      napDescriptor , { containerVersion: '1.0.0' })
      sinon.assert.calledWith(updateContainerVersionStub, 
        napDescriptor,
        '1.0.0')
    })

    it('should bump existing container version if not provided one', async () => {
      await utils.performContainerStateUpdateInCauldron(() => Promise.resolve(true), napDescriptor)
      sinon.assert.calledWith(updateContainerVersionStub, 
        napDescriptor,
        '1.2.4')
    })

    it('should call beginTransaction and commitTransaction', async () => {
      await utils.performContainerStateUpdateInCauldron(() => Promise.resolve(true), napDescriptor)
      sinon.assert.calledOnce(beginTransactionStub)
      sinon.assert.calledOnce(commitTransactionStub)
    })

    it('should call state update function during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().resolves(true)
      await utils.performContainerStateUpdateInCauldron(stateUpdateFunc, napDescriptor)
      sinon.assert.callOrder(beginTransactionStub, stateUpdateFunc, commitTransactionStub)
    })

    it('should discard transaction if an error happens during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'))
      try {
        await utils.performContainerStateUpdateInCauldron(stateUpdateFunc, napDescriptor)
      } catch (e) {}
      sinon.assert.calledOnce(discardTransactionStub)
      sinon.assert.notCalled(commitTransactionStub)
    })

    it('should rethrow error that is thrown during a transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'))
      let hasRethrowError = false
      try {
        await utils.performContainerStateUpdateInCauldron(stateUpdateFunc, napDescriptor)
      } catch (e) {
        if (e.message === 'boum') { hasRethrowError = true }
      }
      expect(hasRethrowError).to.be.true
    })
  })
})
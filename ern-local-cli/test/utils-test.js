import {
  assert,
  expect
} from 'chai'
import {
  cauldron
} from 'ern-core'
import sinon from 'sinon'
import utils from '../src/lib/utils'
import * as fixtures from './fixtures/common'

const basicCauldronFixture = require('./fixtures/cauldron.json')
const emptyCauldronFixture = require('./fixtures/empty-cauldron.json')
const getAllNativeAppsStub = sinon.stub(cauldron, 'getAllNativeApps')

const processExitStub = sinon.stub(process, 'exit')
const logErrorStub = sinon.stub()

global.log = {
  error: logErrorStub
}

// Before each test
beforeEach(() => {
  // Reset the state of all stubs/spies
  processExitStub.reset()
  logErrorStub.reset()
})

function useCauldronFixture(fixture) {
  getAllNativeAppsStub.resolves(fixture.nativeApps)
}

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
      expect(result).to.have.lengthOf(4)
    })

    it('should return only released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true})
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
      expect(result).to.have.lengthOf(2)
    })

    it('should return only android platform released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true, platform: 'android'})
      expect(result).to.have.lengthOf(1)
    })

    it('should return only ios platform released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({ onlyReleasedVersions: true, platform: 'ios'})
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
      it('[isValidContainerVersion] Shoud log error and exit process for invalid container version', () => {
        utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: version
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.validContainerVersions.forEach(version => {
      it('[isValidContainerVersion] Should not log error nor exit process for valid container version', () => {
        utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: version
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.incompleteNapDescriptors.forEach(napDescriptor => {
      it('[isCompleteNapDescriptorString] Should log error and exit process for incomplete nap descriptor', () => {
        utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: napDescriptor
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.completeNapDescriptors.forEach(napDescriptor => {
      it('[isCompleteNapDescriptorString] Should not log error nor exit process for complete nap descriptor', () => {
        utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: napDescriptor
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(napDescriptor => {
      it('[noGitOrFilesystemPath] Should log error and exit process if path is/contains a git or file system scheme', () => {
        utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: napDescriptor
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.withoutGitOrFileSystemPath.forEach(napDescriptor => {
      it('[noGitOrFilesystemPath] Should not log error not exit process if path is not/ does not contain a git or file system scheme', () => {
        utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: napDescriptor
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })
  })
})
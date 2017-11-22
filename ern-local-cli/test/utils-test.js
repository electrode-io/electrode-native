import {
  assert,
  expect
} from 'chai'
import {
  cauldron,
  ModuleTypes,
  yarn
} from 'ern-core'
import {
  NativeApplicationDescriptor
} from 'ern-util'
import * as publication from '../src/lib/publication'
import sinon from 'sinon'
import utils from '../src/lib/utils'
import * as fixtures from './fixtures/common'
import ora from 'ora'
import inquirer from 'inquirer'

// Fixtures
const basicCauldronFixture = require('./fixtures/cauldron.json')
const emptyCauldronFixture = require('./fixtures/empty-cauldron.json')
const npmPackageExists = require('./fixtures/npmPkgExistsResponse.json')
const npmPackageDoesNotExists = '' // 2> /dev/null suppresses stderr in yarn.info

// Cauldron stubs
const getAllNativeAppsStub = sinon.stub(cauldron, 'getAllNativeApps')
const beginTransactionStub = sinon.stub(cauldron, 'beginTransaction')
const commitTransactionStub = sinon.stub(cauldron, 'commitTransaction')
const discardTransactionStub = sinon.stub(cauldron, 'discardTransaction')
const getContainerVersionStub = sinon.stub(cauldron, 'getContainerVersion').resolves('1.0.0')
const getTopLevelContainerVersionStub = sinon.stub(cauldron, 'getTopLevelContainerVersion').resolves('1.2.3')
const updateContainerVersionStub = sinon.stub(cauldron, 'updateContainerVersion')
const getVersionsNameStub = sinon.stub(cauldron, 'getVersionsNames').resolves(['1.2.3', '1.2.4', '2.0.0'])

// Logging stubs
const logErrorStub = sinon.stub()
const logInfoStub = sinon.stub()
const logDebugStub = sinon.stub()

// Ora stubs
const oraProto = Object.getPrototypeOf(ora())
const oraFailStub = sinon.stub()
const oraStartStub = sinon.stub(oraProto, 'start').returns({
  fail: oraFailStub,
  succeed: sinon.stub()
})

// yarn stub
const yarnStub = sinon.stub(yarn, 'info')

// Other stubs
const runCauldronContainerGenStub = sinon.stub(publication, 'runCauldronContainerGen')
const processExitStub = sinon.stub(process, 'exit')
const inquirerStub = sinon.stub(inquirer, 'prompt')

global.log = {
  error: logErrorStub,
  info: logInfoStub,
  debug: logDebugStub
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
  oraFailStub.reset()
  yarnStub.reset()
  inquirerStub.reset()
})

let cauldronIsActiveStub

afterEach(() => {
  cauldronIsActiveStub && cauldronIsActiveStub.restore()
})

function useCauldronFixture (fixture) {
  getAllNativeAppsStub.resolves(fixture.nativeApps)
}

function useNpmPkgFixture (fixture) {
  yarnStub.resolves(fixture)
}

function resolveInquirer (answer) {
  inquirerStub.resolves(answer)
}

after(() => {
  getAllNativeAppsStub.restore()
  processExitStub.restore()
  runCauldronContainerGenStub.restore()
  beginTransactionStub.restore()
  commitTransactionStub.restore()
  discardTransactionStub.restore()
  getContainerVersionStub.restore()
  getTopLevelContainerVersionStub.restore()
  updateContainerVersionStub.restore()
  oraStartStub.restore()
  yarnStub.restore()
  inquirerStub.restore()
})

// Utility function that returns true if a given async function execution
// throws an exception, false otherwise
// DUPLICATE : TO BE MOVED TO ERN-UTIL-DEV
async function doesThrow (asyncFn, ...args) {
  let threwError = false
  try {
    await asyncFn(...args)
  } catch (e) {
    threwError = true
  }
  return threwError === true
}

async function doesNotThrow (asyncFn, ... args) {
  let threwError = false
  try {
    await asyncFn(...args)
  } catch (e) {
    threwError = true
  }
  return threwError === false
}

describe('utils.js', () => {
  // ==========================================================
  // getNapDescriptorStringsFromCauldron
  // ==========================================================
  describe('getNapDescriptorStringsFromCauldron', () => {
    it('should return an empty array if no match', async () => {
      useCauldronFixture(emptyCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return all native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron()
      expect(result).to.have.lengthOf(5)
    })

    it('should return only released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({onlyReleasedVersions: true})
      expect(result).to.have.lengthOf(3)
    })

    it('should return only non released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({onlyNonReleasedVersions: true})
      expect(result).to.have.lengthOf(2)
    })

    it('should return only android platform native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({platform: 'android'})
      expect(result).to.have.lengthOf(2)
    })

    it('should return only ios platform native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({platform: 'ios'})
      expect(result).to.have.lengthOf(3)
    })

    it('should return only android platform released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({onlyReleasedVersions: true, platform: 'android'})
      expect(result).to.have.lengthOf(1)
    })

    it('should return only android platform non released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyNonReleasedVersions: true,
        platform: 'android'
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only ios platform released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({onlyReleasedVersions: true, platform: 'ios'})
      expect(result).to.have.lengthOf(2)
    })

    it('should return only ios platform non released native apps descriptors', async () => {
      useCauldronFixture(basicCauldronFixture)
      const result = await utils.getNapDescriptorStringsFromCauldron({onlyNonReleasedVersions: true, platform: 'ios'})
      expect(result).to.have.lengthOf(1)
    })
  })

  // ==========================================================
  // logErrorAndExitIfNotSatisfied
  // ==========================================================
  function assertLoggedErrorAndExitedProcess () {
    sinon.assert.calledOnce(oraFailStub)
    sinon.assert.calledOnce(processExitStub)
    assert(oraFailStub.calledBefore(processExitStub))
  }

  function assertNoErrorLoggedAndNoProcessExit () {
    sinon.assert.notCalled(oraFailStub)
    sinon.assert.notCalled(processExitStub)
  }

  describe('logErrorAndExitIfNotSatisfied', () => {
    fixtures.invalidContainerVersions.forEach(containerVersion => {
      it('[isValidContainerVersion] Should log error and exit process for invalid container version', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: {containerVersion}
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.validContainerVersions.forEach(containerVersion => {
      it('[isValidContainerVersion] Should not log error nor exit process for valid container version', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: {containerVersion}
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.incompleteNapDescriptors.forEach(descriptor => {
      it('[isCompleteNapDescriptorString] Should log error and exit process for incomplete nap descriptor', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: {descriptor}
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.completeNapDescriptors.forEach(descriptor => {
      it('[isCompleteNapDescriptorString] Should not log error nor exit process for complete nap descriptor', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: {descriptor}
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(obj => {
      it('[noGitOrFilesystemPath] Should log error and exit process if path is/contains a git or file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: {obj}
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.withoutGitOrFileSystemPath.forEach(obj => {
      it('[noGitOrFilesystemPath] Should not log error not exit process if path is not/ does not contain a git or file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: {obj}
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.withFileSystemPath.forEach(obj => {
      it('[noFileSystemPath] Should log error and exit process if path is/contains a file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noFileSystemPath: {obj}
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.withoutFileSystemPath.forEach(obj => {
      it('[noFileSystemPath] Should not log error not exit process if path is not/ does not contain a  file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noFileSystemPath: {obj}
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    it('[cauldronIsActive] Shoud log error and exit process if cauldron is not active', async () => {
      cauldronIsActiveStub = sinon.stub(cauldron, 'isActive').returns(false)
      await utils.logErrorAndExitIfNotSatisfied({
        cauldronIsActive: {}
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[cauldronIsActive] Shoud not log error not exit process if cauldron is active', async () => {
      cauldronIsActiveStub = sinon.stub(cauldron, 'isActive').returns(true)
      await utils.logErrorAndExitIfNotSatisfied({
        cauldronIsActive: {}
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    fixtures.validNpmPackageNames.forEach(name => {
      it('[isValidPackageName] Should not log error nor exit process if package name is valid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidNpmPackageName: {name}
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.invalidNpmPackageNames.forEach(name => {
      it('[isValidPackageName] Should log error and exit process if package name is invalid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidNpmPackageName: {name}
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.validElectrodeNativeModuleNames.forEach(name => {
      it('[isValidElectrodeNativeModuleName] Should not log error nor exit process if module name is valid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidElectrodeNativeModuleName: {name}
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.invalidElectrodeNativeModuleNames.forEach(name => {
      it('[isValidElectrodeNativeModuleName] Should log error and exit process if module name is invalid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidElectrodeNativeModuleName: {name}
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    it('[sameNativeApplicationAndPlatform] Shoud log error and exit process if descriptors do not all match same native application platform', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        sameNativeApplicationAndPlatform: {descriptors: fixtures.differentNativeApplicationPlatformDescriptors}
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[sameNativeApplicationAndPlatform] Shoud not log error anornd exit process if descriptors do not all match same native application platform', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        sameNativeApplicationAndPlatform: {descriptors: fixtures.sameNativeApplicationPlatformDescriptors}
      })
      assertNoErrorLoggedAndNoProcessExit()
    })
  })

  // ==========================================================
  // performContainerStateUpdateInCauldron
  // ==========================================================
  describe('performContainerStateUpdateInCauldron', () => {
    const napDescriptor = NativeApplicationDescriptor.fromString('testapp:android:1.0.0')

    it('should uppdate container version with provided one', async () => {
      await utils.performContainerStateUpdateInCauldron(() => Promise.resolve(true),
        napDescriptor, 'commit message', {containerVersion: '1.0.0'})
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
      await utils.performContainerStateUpdateInCauldron(stateUpdateFunc, napDescriptor, 'commit message')
      sinon.assert.callOrder(beginTransactionStub, stateUpdateFunc, commitTransactionStub)
    })

    it('should discard transaction if an error happens during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'))
      try {
        await utils.performContainerStateUpdateInCauldron(stateUpdateFunc, napDescriptor, 'commit message')
      } catch (e) {}
      sinon.assert.calledOnce(discardTransactionStub)
      sinon.assert.notCalled(commitTransactionStub)
    })

    it('should rethrow error that is thrown during a transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'))
      let hasRethrowError = false
      try {
        await utils.performContainerStateUpdateInCauldron(stateUpdateFunc, napDescriptor, 'commit message')
      } catch (e) {
        if (e.message === 'boum') { hasRethrowError = true }
      }
      expect(hasRethrowError).to.be.true
    })
  })

  // ==========================================================
  // doesPackageExistInNpm
  // ==========================================================
  describe('doesPackageExistInNpm', () => {
    it('should return true if npm package exists', async () => {
      useNpmPkgFixture(npmPackageExists)
      const result = await utils.doesPackageExistInNpm(fixtures.npmPkgNameExists)
      expect(result).to.be.true
    })

    it('should return false if npm package does not exists', async () => {
      useNpmPkgFixture(npmPackageDoesNotExists)
      const result = await utils.doesPackageExistInNpm(fixtures.npmPkgNameDoesNotExists)
      expect(result).to.be.false
    })
  })

  // ==========================================================
  // performPkgNameConflictCheck
  // ==========================================================
  describe('performPkgNameConflictCheck', () => {
    it('if package does not exists in npm return true', async () => {
      useNpmPkgFixture(npmPackageDoesNotExists)
      const result = await utils.performPkgNameConflictCheck(fixtures.npmPkgNameDoesNotExists)
      expect(result).to.be.true
    })

    it('if package exists in npm and user confirms exit execution return false ', async () => {
      useNpmPkgFixture(npmPackageExists)
      resolveInquirer({continueIfPkgNameExists: false})
      const result = await utils.performPkgNameConflictCheck(fixtures.npmPkgNameExists)
      expect(result).to.be.false
    })

    it('if package exists in npm and user confirms continue execution return true', async () => {
      useNpmPkgFixture(npmPackageExists)
      resolveInquirer({continueIfPkgNameExists: true})
      const result = await utils.performPkgNameConflictCheck(fixtures.npmPkgNameExists)
      expect(result).to.be.true
    })
  })

  // ==========================================================
  // checkIfModuleNameContainsSuffix
  // ==========================================================
  describe('checkIfModuleNameContainsSuffix', () => {
    it('should return false if module name of mini-app does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(fixtures.npmPkgName, ModuleTypes.MINIAPP)
      expect(result).to.be.false
    })

    it('should return false if module name of api does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(fixtures.npmPkgName, ModuleTypes.API)
      expect(result).to.be.false
    })

    it('should return false if module name of (js) api-impl does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(fixtures.npmPkgName, ModuleTypes.JS_API_IMPL)
      expect(result).to.be.false
    })

    it('should return false if module name of (native) api-impl does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(fixtures.npmPkgName, ModuleTypes.NATIVE_API_IMPL)
      expect(result).to.be.false
    })

    it('should return false if module type is not supported', () => {
      const result = utils.checkIfModuleNameContainsSuffix(fixtures.npmPkgName, fixtures.moduleTypeNotSupported)
      expect(result).to.be.false
    })

    fixtures.miniAppNameWithSuffix.forEach(name => {
      it('should return true if module name of mini-app contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(name, ModuleTypes.MINIAPP)
        expect(result).to.be.true
      })
    })

    fixtures.apiNameWithSuffix.forEach(name => {
      it('should return true if module name of api contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(name, ModuleTypes.API)
        expect(result).to.be.true
      })
    })

    fixtures.apiJsImplNameWithSuffix.forEach(name => {
      it('should return true if module name of (js) api-impl contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(name, ModuleTypes.JS_API_IMPL)
        expect(result).to.be.true
      })
    })

    fixtures.apiNativeImplNameWithSuffix.forEach(name => {
      it('should return true if module name of (native) api-impl contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(name, ModuleTypes.NATIVE_API_IMPL)
        expect(result).to.be.true
      })
    })
  })

  // ==========================================================
  // promptUserToUseSuffixModuleName
  // ==========================================================
  describe('promptUserToUseSuffixModuleName', () => {
    it('return suffixed mini-app name if user confirms true', async () => {
      resolveInquirer({useSuffixedModuleName: true})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.MINIAPP)
      expect(result).to.be.equal(`${fixtures.npmPkgName}MiniApp`)
    })

    it('return suffixed api name if user confirms true', async () => {
      resolveInquirer({useSuffixedModuleName: true})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.API)
      expect(result).to.be.equal(`${fixtures.npmPkgName}Api`)
    })

    it('return suffixed (js) api-impl name if user confirms true', async () => {
      resolveInquirer({useSuffixedModuleName: true})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.JS_API_IMPL)
      expect(result).to.be.equal(`${fixtures.npmPkgName}ApiImplJs`)
    })

    it('return suffixed (native) api-impl name if user confirms true', async () => {
      resolveInquirer({useSuffixedModuleName: true})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.NATIVE_API_IMPL)
      expect(result).to.be.equal(`${fixtures.npmPkgName}ApiImplNative`)
    })

    it('return non-suffixed mini-app name if user selects false', async () => {
      resolveInquirer({useSuffixedModuleName: false})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.MINIAPP)
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed api name if user selects false', async () => {
      resolveInquirer({useSuffixedModuleName: false})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.API)
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed (js) api-impl name if user selects false', async () => {
      resolveInquirer({useSuffixedModuleName: false})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.JS_API_IMPL)
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed (native) api-impl name if user selects false', async () => {
      resolveInquirer({useSuffixedModuleName: false})
      const result = await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, ModuleTypes.NATIVE_API_IMPL)
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed (native) api-impl name if user selects false', async () => {
      try {
        await utils.promptUserToUseSuffixModuleName(fixtures.npmPkgName, fixtures.moduleTypeNotSupported)
      } catch (e) {
       expect(e.message).to.include('Unsupported module type :')
      }
    })
  })

  // ==========================================================
  // getDescriptorsMatchingSemVerDescriptor
  // ==========================================================
  describe('getDescriptorsMatchingSemVerDescriptor', () => {
    it('should throw if the descriptor does not contain a platform', async () => {
      const descriptor = NativeApplicationDescriptor.fromString('testapp')
      assert(await doesThrow(utils.getDescriptorsMatchingSemVerDescriptor, descriptor))
    })

    it('should throw if the descriptor does not contain a version', async () => {
      const descriptor = NativeApplicationDescriptor.fromString('testapp:android')
      assert(await doesThrow(utils.getDescriptorsMatchingSemVerDescriptor, descriptor))
    })

    it('should return an empty array if the semver descriptor does not match any version', async () => {
      const descriptor = NativeApplicationDescriptor.fromString('testapp:android:5.0.0')
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(descriptor)
      expect(result).to.be.an('array').empty
    })

    it('should return the right matched versions [1]', async () => {
      const descriptor = NativeApplicationDescriptor.fromString('testapp:android:^1.0.0')
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(descriptor)
      expect(result).to.be.an('array').of.length(2)
    })

    it('should return the right matched versions [2]', async () => {
      const descriptor = NativeApplicationDescriptor.fromString('testapp:android:2.0.x')
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(descriptor)
      expect(result).to.be.an('array').of.length(1)
    })
  })
})
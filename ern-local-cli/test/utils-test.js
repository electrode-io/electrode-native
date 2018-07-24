// @flow

import { assert, expect } from 'chai'
import {
  ModuleTypes,
  NativeApplicationDescriptor,
  yarn,
  utils as coreUtils,
  createTmpDir,
} from 'ern-core'
import * as cauldron from 'ern-cauldron-api'
import {
  doesThrow,
  doesNotThrow,
  beforeTest,
  afterTest,
  fixtures as utilFixtures,
} from 'ern-util-dev'
import * as container from '../src/lib/container'
import sinon from 'sinon'
import utils from '../src/lib/utils'
import * as fixtures from './fixtures/common'
import ora from 'ora'
import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

// Fixtures
const basicCauldronFixture = utilFixtures.defaultCauldron
const emptyCauldronFixture = utilFixtures.emptyCauldron
const npmPackageExists = require('./fixtures/npmPkgExistsResponse.json')
const npmPackageDoesNotExists = '' // 2> /dev/null suppresses stderr in yarn.info
const sandbox = sinon.createSandbox()
const topLevelContainerVersion = '1.2.3'

let cauldronHelperStub
let yarnInfoStub
let oraFailStub
let processExitStub
let inquirerPromptStub

describe('utils.js', () => {
  // Before each test
  beforeEach(() => {
    beforeTest()
    cauldronHelperStub = sandbox.createStubInstance(cauldron.CauldronHelper)
    cauldronHelperStub.getContainerVersion.resolves('1.0.0')
    cauldronHelperStub.getTopLevelContainerVersion.resolves(
      topLevelContainerVersion
    )
    cauldronHelperStub.getVersionsNames.resolves([
      '1.2.3',
      '1.2.4',
      '2.0.0',
      '3.0',
    ])
    // Ora stubs
    const oraProto = Object.getPrototypeOf(ora())
    oraFailStub = sandbox.stub()
    const oraStartStub = sandbox.stub(oraProto, 'start').returns({
      fail: oraFailStub,
      succeed: sandbox.stub(),
    })

    // yarn stub
    yarnInfoStub = sandbox.stub(yarn, 'info')

    // Other stubs
    sandbox.stub(container, 'runCauldronContainerGen')
    processExitStub = sandbox.stub(process, 'exit')
    inquirerPromptStub = sandbox.stub(inquirer, 'prompt')

    sandbox.stub(cauldron, 'getActiveCauldron').resolves(cauldronHelperStub)
  })

  afterEach(() => {
    afterTest()
    sandbox.restore()
  })

  // ==========================================================
  // getNapDescriptorStringsFromCauldron
  // ==========================================================
  describe('getNapDescriptorStringsFromCauldron', () => {
    it('should return an empty array if no match', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        emptyCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron()
      expect(result).to.be.an('array').that.is.empty
    })

    it('should return all native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron()
      expect(result).to.have.lengthOf(2)
    })

    it('should return only released native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyReleasedVersions: true,
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only non released native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyNonReleasedVersions: true,
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only android platform native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        platform: 'android',
      })
      expect(result).to.have.lengthOf(2)
    })

    it('should return only ios platform native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        platform: 'ios',
      })
      expect(result).to.have.lengthOf(0)
    })

    it('should return only android platform released native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyReleasedVersions: true,
        platform: 'android',
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only android platform non released native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyNonReleasedVersions: true,
        platform: 'android',
      })
      expect(result).to.have.lengthOf(1)
    })

    it('should return only ios platform released native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyReleasedVersions: true,
        platform: 'ios',
      })
      expect(result).to.have.lengthOf(0)
    })

    it('should return only ios platform non released native apps descriptors', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      const result = await utils.getNapDescriptorStringsFromCauldron({
        onlyNonReleasedVersions: true,
        platform: 'ios',
      })
      expect(result).to.have.lengthOf(0)
    })
  })

  // ==========================================================
  // logErrorAndExitIfNotSatisfied
  // ==========================================================
  function assertLoggedErrorAndExitedProcess() {
    sinon.assert.calledOnce(oraFailStub)
    sinon.assert.calledOnce(processExitStub)
    assert(oraFailStub.calledBefore(processExitStub))
  }

  function assertNoErrorLoggedAndNoProcessExit() {
    sinon.assert.notCalled(oraFailStub)
    sinon.assert.notCalled(processExitStub)
  }

  describe('logErrorAndExitIfNotSatisfied', () => {
    fixtures.invalidContainerVersions.forEach(containerVersion => {
      it('[isValidContainerVersion] Should log error and exit process for invalid container version', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: { containerVersion },
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.validContainerVersions.forEach(containerVersion => {
      it('[isValidContainerVersion] Should not log error nor exit process for valid container version', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidContainerVersion: { containerVersion },
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    it('[isNewerContainerVersion] Should log error and exit process for container version is not new', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        isNewerContainerVersion: {
          descriptor: 'myapp:android:17.14.0',
          containerVersion: topLevelContainerVersion,
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[isNewerContainerVersion] Should not log error and nor exit process for newer container version', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        isNewerContainerVersion: {
          descriptor: 'myapp:android:17.14.0',
          containerVersion: '2.2.2',
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    fixtures.incompleteNapDescriptors.forEach(descriptor => {
      it('[isCompleteNapDescriptorString] Should log error and exit process for incomplete nap descriptor', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: { descriptor },
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.completeNapDescriptors.forEach(descriptor => {
      it('[isCompleteNapDescriptorString] Should not log error nor exit process for complete nap descriptor', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isCompleteNapDescriptorString: { descriptor },
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.withGitOrFileSystemPath.forEach(obj => {
      it('[noGitOrFilesystemPath] Should log error and exit process if path is/contains a git or file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: { obj },
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.withoutGitOrFileSystemPath.forEach(obj => {
      it('[noGitOrFilesystemPath] Should not log error not exit process if path is not/ does not contain a git or file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noGitOrFilesystemPath: { obj },
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.withFileSystemPath.forEach(obj => {
      it('[noFileSystemPath] Should log error and exit process if path is/contains a file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noFileSystemPath: { obj },
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.withoutFileSystemPath.forEach(obj => {
      it('[noFileSystemPath] Should not log error not exit process if path is not/ does not contain a  file system scheme', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          noFileSystemPath: { obj },
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    /*it('[cauldronIsActive] Shoud log error and exit process if cauldron is not active', async () => {
      isActiveStub.returns(false)
      await utils.logErrorAndExitIfNotSatisfied({
        cauldronIsActive: {}
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[cauldronIsActive] Shoud not log error not exit process if cauldron is active', async () => {
      isActiveStub.returns(true)
      await utils.logErrorAndExitIfNotSatisfied({
        cauldronIsActive: {}
      })
      assertNoErrorLoggedAndNoProcessExit()
    })*/

    fixtures.validNpmPackageNames.forEach(name => {
      it('[isValidPackageName] Should not log error nor exit process if package name is valid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidNpmPackageName: { name },
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.invalidNpmPackageNames.forEach(name => {
      it('[isValidPackageName] Should log error and exit process if package name is invalid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidNpmPackageName: { name },
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    fixtures.validElectrodeNativeModuleNames.forEach(name => {
      it('[isValidElectrodeNativeModuleName] Should not log error nor exit process if module name is valid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidElectrodeNativeModuleName: { name },
        })
        assertNoErrorLoggedAndNoProcessExit()
      })
    })

    fixtures.invalidElectrodeNativeModuleNames.forEach(name => {
      it('[isValidElectrodeNativeModuleName] Should log error and exit process if module name is invalid', async () => {
        await utils.logErrorAndExitIfNotSatisfied({
          isValidElectrodeNativeModuleName: { name },
        })
        assertLoggedErrorAndExitedProcess()
      })
    })

    it('[sameNativeApplicationAndPlatform] Should log error and exit process if descriptors do not all match same native application platform', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        sameNativeApplicationAndPlatform: {
          descriptors: fixtures.differentNativeApplicationPlatformDescriptors,
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[sameNativeApplicationAndPlatform] Should not log error anornd exit process if descriptors do not all match same native application platform', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        sameNativeApplicationAndPlatform: {
          descriptors: fixtures.sameNativeApplicationPlatformDescriptors,
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    it('[checkIfCodePushOptionsAreValid] Should log error and exit process if targetBinaryVersion is specified with more than 1 descriptor ', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        checkIfCodePushOptionsAreValid: {
          descriptors: fixtures.differentNativeApplicationPlatformDescriptors,
          targetBinaryVersion: '1.1.0',
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[checkIfCodePushOptionsAreValid] Should not log error and exit process if targetBinaryVersion is specified with more than 1 descriptor ', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        checkIfCodePushOptionsAreValid: {
          descriptors: ['testapp:android:1.0.0'],
          targetBinaryVersion: '1.1.0',
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    it('[checkIfCodePushOptionsAreValid] Should log error and exit process if targetBinaryVersion & semVerDescriptor are specified ', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        checkIfCodePushOptionsAreValid: {
          descriptors: ['testapp:android:1.0.0'],
          targetBinaryVersion: '1.1.0',
          semVerDescriptor: '~1.1.0',
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[checkIfCodePushOptionsAreValid] Should not log error and exit process if more than 1 descriptor and semVerDescriptor are specified', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        checkIfCodePushOptionsAreValid: {
          descriptors: fixtures.differentNativeApplicationPlatformDescriptors,
          semVerDescriptor: '~1.1.0',
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    it('[pathExist] Should not log error nor exit if path exists', async () => {
      const tmpDirPath = createTmpDir()
      await utils.logErrorAndExitIfNotSatisfied({
        pathExist: {
          p: tmpDirPath,
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    it('[pathExist] Should log error and exist if path does not exist', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        pathExist: {
          p: '/non/existing/path',
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[isFilePath] Should not log error nor exist if path is a file path', async () => {
      const tmpDirPath = createTmpDir()
      const tmpFilePath = path.join(tmpDirPath, 'file.test')
      const tmpFile = fs.writeFileSync(tmpFilePath, 'CONTENT')
      await utils.logErrorAndExitIfNotSatisfied({
        isFilePath: {
          p: tmpFilePath,
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    it('[isFilePath] Should log error and exist if path is not a file path', async () => {
      const tmpDirPath = createTmpDir()
      await utils.logErrorAndExitIfNotSatisfied({
        isFilePath: {
          p: tmpDirPath,
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[isFilePath] Should log error and exist if path does not exist', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        isFilePath: {
          p: '/non/existing/path',
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[isDirectoryPath] Should not log error nor exist if path is a directory path', async () => {
      const tmpDirPath = createTmpDir()
      await utils.logErrorAndExitIfNotSatisfied({
        isDirectoryPath: {
          p: tmpDirPath,
        },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })

    it('[isDirectoryPath] Should log error and exit if path is not a directory path', async () => {
      const tmpDirPath = createTmpDir()
      const tmpFilePath = path.join(tmpDirPath, 'file.test')
      const tmpFile = fs.writeFileSync(tmpFilePath, 'CONTENT')
      await utils.logErrorAndExitIfNotSatisfied({
        isDirectoryPath: {
          p: tmpFilePath,
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[isDirectoryPath] Should log error and exit if path does not exists', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        isDirectoryPath: {
          p: '/non/existing/path',
        },
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[isValidPlatformConfig] Should log error and exit if key is not whitelisted', async () => {
      await utils.logErrorAndExitIfNotSatisfied({
        isValidPlatformConfig: {
          p: 'keyNotWhiteListed',
        },
      })
      assertLoggedErrorAndExitedProcess()
    })
  })

  // ==========================================================
  // askUserToChooseANapDescriptorFromCauldron
  // ==========================================================
  describe('askUserToChooseANapDescriptorFromCauldron', () => {
    it('throw error if cannot not find any qualifying native application version in the Cauldron', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        emptyCauldronFixture.nativeApps
      )
      let hasRethrowError = false
      try {
        await utils.askUserToChooseANapDescriptorFromCauldron()
      } catch (err) {
        if (
          err.message ===
          'Could not find any qualifying native application version in the Cauldron'
        )
          hasRethrowError = true
      }
      expect(hasRethrowError).to.be.true
    })

    it('return user selected NapDescriptor from Cauldron', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      inquirerPromptStub.resolves({
        userSelectedCompleteNapDescriptor: fixtures.validCompleteNapDescriptor,
      })
      const result = await utils.askUserToChooseANapDescriptorFromCauldron()
      expect(result).to.equal(fixtures.validCompleteNapDescriptor)
    })
  })

  // ==========================================================
  // askUserToChooseOneOrMoreNapDescriptorFromCauldron
  // ==========================================================
  describe('askUserToChooseOneOrMoreNapDescriptorFromCauldron', () => {
    it('throw error if cannot not find any qualifying native application version in the Cauldron', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        emptyCauldronFixture.nativeApps
      )
      let hasRethrowError = false
      try {
        await utils.askUserToChooseOneOrMoreNapDescriptorFromCauldron()
      } catch (err) {
        if (
          err.message ===
          'Could not find any qualifying native application version in the Cauldron'
        )
          hasRethrowError = true
      }
      expect(hasRethrowError).to.be.true
    })

    it('return user selected NapDescriptor from Cauldron', async () => {
      cauldronHelperStub.getAllNativeApps.resolves(
        basicCauldronFixture.nativeApps
      )
      inquirerPromptStub.resolves({
        userSelectedCompleteNapDescriptors: fixtures.validCompleteNapDescriptor,
      })
      const result = await utils.askUserToChooseOneOrMoreNapDescriptorFromCauldron()
      expect(result).to.equal(fixtures.validCompleteNapDescriptor)
    })
  })

  // ==========================================================
  // performContainerStateUpdateInCauldron
  // ==========================================================
  describe('performContainerStateUpdateInCauldron', () => {
    const napDescriptor = NativeApplicationDescriptor.fromString(
      'testapp:android:1.0.0'
    )

    it('should update container version with provided one', async () => {
      await utils.performContainerStateUpdateInCauldron(
        () => Promise.resolve(true),
        napDescriptor,
        'commit message',
        { containerVersion: '1.0.0' }
      )
      sinon.assert.calledWith(
        cauldronHelperStub.updateContainerVersion,
        napDescriptor,
        '1.0.0'
      )
    })

    it('should bump existing container version if not provided one', async () => {
      await utils.performContainerStateUpdateInCauldron(
        () => Promise.resolve(true),
        napDescriptor,
        ''
      )
      sinon.assert.calledWith(
        cauldronHelperStub.updateContainerVersion,
        napDescriptor,
        '1.2.4'
      )
    })

    it('should call beginTransaction and commitTransaction', async () => {
      await utils.performContainerStateUpdateInCauldron(
        () => Promise.resolve(true),
        napDescriptor,
        ''
      )
      sinon.assert.calledOnce(cauldronHelperStub.beginTransaction)
      sinon.assert.calledOnce(cauldronHelperStub.commitTransaction)
    })

    it('should call state update function during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().resolves(true)
      await utils.performContainerStateUpdateInCauldron(
        stateUpdateFunc,
        napDescriptor,
        'commit message'
      )
      sinon.assert.callOrder(
        cauldronHelperStub.beginTransaction,
        stateUpdateFunc,
        cauldronHelperStub.commitTransaction
      )
    })

    it('should discard transaction if an error happens during the transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'))
      try {
        await utils.performContainerStateUpdateInCauldron(
          stateUpdateFunc,
          napDescriptor,
          'commit message'
        )
      } catch (e) {}
      sinon.assert.calledOnce(cauldronHelperStub.discardTransaction)
      sinon.assert.notCalled(cauldronHelperStub.commitTransaction)
    })

    it('should rethrow error that is thrown during a transaction', async () => {
      const stateUpdateFunc = sinon.stub().rejects(new Error('boum'))
      let hasRethrowError = false
      try {
        await utils.performContainerStateUpdateInCauldron(
          stateUpdateFunc,
          napDescriptor,
          'commit message'
        )
      } catch (e) {
        if (e.message === 'boum') {
          hasRethrowError = true
        }
      }
      expect(hasRethrowError).to.be.true
    })
  })

  // ==========================================================
  // doesPackageExistInNpm
  // ==========================================================
  describe('doesPackageExistInNpm', () => {
    it('should return true if npm package exists', async () => {
      yarnInfoStub.resolves(npmPackageExists)
      const result = await utils.doesPackageExistInNpm(
        fixtures.npmPkgNameExists
      )
      expect(result).to.be.true
    })

    it('should return false if npm package does not exists', async () => {
      yarnInfoStub.resolves(npmPackageDoesNotExists)
      const result = await utils.doesPackageExistInNpm(
        fixtures.npmPkgNameDoesNotExists
      )
      expect(result).to.be.false
    })
  })

  // ==========================================================
  // performPkgNameConflictCheck
  // ==========================================================
  describe('performPkgNameConflictCheck', () => {
    it('if package does not exists in npm return true', async () => {
      yarnInfoStub.resolves(npmPackageDoesNotExists)
      const result = await utils.performPkgNameConflictCheck(
        fixtures.npmPkgNameDoesNotExists
      )
      expect(result).to.be.true
    })

    it('if package exists in npm and user confirms exit execution return false ', async () => {
      yarnInfoStub.resolves(npmPackageExists)
      inquirerPromptStub.resolves({ continueIfPkgNameExists: false })
      const result = await utils.performPkgNameConflictCheck(
        fixtures.npmPkgNameExists
      )
      expect(result).to.be.false
    })

    it('if package exists in npm and user confirms continue execution return true', async () => {
      yarnInfoStub.resolves(npmPackageExists)
      inquirerPromptStub.resolves({ continueIfPkgNameExists: true })
      const result = await utils.performPkgNameConflictCheck(
        fixtures.npmPkgNameExists
      )
      expect(result).to.be.true
    })
  })

  // ==========================================================
  // checkIfModuleNameContainsSuffix
  // ==========================================================
  describe('checkIfModuleNameContainsSuffix', () => {
    it('should return false if module name of mini-app does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(
        fixtures.npmPkgName,
        ModuleTypes.MINIAPP
      )
      expect(result).to.be.false
    })

    it('should return false if module name of api does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(
        fixtures.npmPkgName,
        ModuleTypes.API
      )
      expect(result).to.be.false
    })

    it('should return false if module name of (js) api-impl does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(
        fixtures.npmPkgName,
        ModuleTypes.JS_API_IMPL
      )
      expect(result).to.be.false
    })

    it('should return false if module name of (native) api-impl does not contain suffix', () => {
      const result = utils.checkIfModuleNameContainsSuffix(
        fixtures.npmPkgName,
        ModuleTypes.NATIVE_API_IMPL
      )
      expect(result).to.be.false
    })

    it('should return false if module type is not supported', () => {
      const result = utils.checkIfModuleNameContainsSuffix(
        fixtures.npmPkgName,
        fixtures.moduleTypeNotSupported
      )
      expect(result).to.be.false
    })

    fixtures.miniAppNameWithSuffix.forEach(name => {
      it('should return true if module name of mini-app contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(
          name,
          ModuleTypes.MINIAPP
        )
        expect(result).to.be.true
      })
    })

    fixtures.apiNameWithSuffix.forEach(name => {
      it('should return true if module name of api contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(
          name,
          ModuleTypes.API
        )
        expect(result).to.be.true
      })
    })

    fixtures.apiJsImplNameWithSuffix.forEach(name => {
      it('should return true if module name of (js) api-impl contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(
          name,
          ModuleTypes.JS_API_IMPL
        )
        expect(result).to.be.true
      })
    })

    fixtures.apiNativeImplNameWithSuffix.forEach(name => {
      it('should return true if module name of (native) api-impl contains suffix', () => {
        const result = utils.checkIfModuleNameContainsSuffix(
          name,
          ModuleTypes.NATIVE_API_IMPL
        )
        expect(result).to.be.true
      })
    })
  })

  // ==========================================================
  // promptUserToUseSuffixModuleName
  // ==========================================================
  describe('promptUserToUseSuffixModuleName', () => {
    it('return suffixed mini-app name if user confirms true', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: true })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.MINIAPP
      )
      expect(result).to.be.equal(`${fixtures.npmPkgName}MiniApp`)
    })

    it('return suffixed api name if user confirms true', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: true })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.API
      )
      expect(result).to.be.equal(`${fixtures.npmPkgName}Api`)
    })

    it('return suffixed (js) api-impl name if user confirms true', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: true })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.JS_API_IMPL
      )
      expect(result).to.be.equal(`${fixtures.npmPkgName}ApiImplJs`)
    })

    it('return suffixed (native) api-impl name if user confirms true', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: true })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.NATIVE_API_IMPL
      )
      expect(result).to.be.equal(`${fixtures.npmPkgName}ApiImplNative`)
    })

    it('return non-suffixed mini-app name if user selects false', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: false })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.MINIAPP
      )
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed api name if user selects false', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: false })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.API
      )
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed (js) api-impl name if user selects false', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: false })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.JS_API_IMPL
      )
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed (native) api-impl name if user selects false', async () => {
      inquirerPromptStub.resolves({ useSuffixedModuleName: false })
      const result = await utils.promptUserToUseSuffixModuleName(
        fixtures.npmPkgName,
        ModuleTypes.NATIVE_API_IMPL
      )
      expect(result).to.be.equal(fixtures.npmPkgName)
    })

    it('return non-suffixed (native) api-impl name if user selects false', async () => {
      try {
        await utils.promptUserToUseSuffixModuleName(
          fixtures.npmPkgName,
          fixtures.moduleTypeNotSupported
        )
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
      assert(
        await doesThrow(
          utils.getDescriptorsMatchingSemVerDescriptor,
          null,
          descriptor
        )
      )
    })

    it('should throw if the descriptor does not contain a version', async () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'testapp:android'
      )
      assert(
        await doesThrow(
          utils.getDescriptorsMatchingSemVerDescriptor,
          null,
          descriptor
        )
      )
    })

    it('should return an empty array if the semver descriptor does not match any version', async () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'testapp:android:5.0.0'
      )
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result).to.be.an('array').empty
    })

    it('should return the right matched versions [1]', async () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'testapp:android:^1.0.0'
      )
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result)
        .to.be.an('array')
        .of.length(2)
    })

    it('should return the right matched versions [2]', async () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'testapp:android:2.0.x'
      )
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
    })

    it('should return the right matched versions [3]', async () => {
      const descriptor = NativeApplicationDescriptor.fromString(
        'testapp:android:3.0.x'
      )
      const result = await utils.getDescriptorsMatchingSemVerDescriptor(
        descriptor
      )
      expect(result)
        .to.be.an('array')
        .of.length(1)
      expect(result[0].version).eql('3.0')
    })
  })

  describe('normalizeVersionsToSemver', () => {
    it('should return an array containing the normalized versions', () => {
      const versions = ['1.0.0', '2.0', '3', '1.0.0-beta', '2.0-beta', '2-beta']
      const result = utils.normalizeVersionsToSemver(versions)
      expect(result)
        .to.be.an('array')
        .deep.equal([
          '1.0.0',
          '2.0.0',
          '3.0.0',
          '1.0.0-beta',
          '2.0.0-beta',
          '2.0.0-beta',
        ])
    })
  })
})

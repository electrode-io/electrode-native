import { createTmpDir, yarn, AppVersionDescriptor } from 'ern-core'
import * as cauldron from 'ern-cauldron-api'
import sinon from 'sinon'
import * as fixtures from './fixtures/common'
import { logErrorAndExitIfNotSatisfied } from '../src/lib/logErrorAndExitIfNotSatisfied'
import path from 'path'
import fs from 'fs'

describe('logErrorAndExitIfNotSatisfied', () => {
  const topLevelContainerVersion = '1.2.3'

  let processExitStub
  let cauldronHelperStub
  let yarnInfoStub

  function assertLoggedErrorAndExitedProcess() {
    sinon.assert.calledOnce(processExitStub)
  }

  function assertNoErrorLoggedAndNoProcessExit() {
    sinon.assert.notCalled(processExitStub)
  }

  const sandbox = sinon.createSandbox()

  beforeEach(() => {
    processExitStub = sandbox.stub(process, 'exit')
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
    cauldronHelperStub.getFile.resolves('{"key":"value"}')
    yarnInfoStub = sandbox.stub(yarn, 'info')
    sandbox.stub(cauldron, 'getActiveCauldron').resolves(cauldronHelperStub)
  })

  afterEach(() => {
    sandbox.restore()
  })

  fixtures.invalidContainerVersions.forEach(containerVersion => {
    it('[isValidContainerVersion] Should log error and exit process for invalid container version', async () => {
      await logErrorAndExitIfNotSatisfied({
        isValidContainerVersion: { containerVersion },
      })
      assertLoggedErrorAndExitedProcess()
    })
  })

  fixtures.validContainerVersions.forEach(containerVersion => {
    it('[isValidContainerVersion] Should not log error nor exit process for valid container version', async () => {
      await logErrorAndExitIfNotSatisfied({
        isValidContainerVersion: { containerVersion },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })
  })

  it('[isNewerContainerVersion] Should log error and exit process for container version is not new', async () => {
    await logErrorAndExitIfNotSatisfied({
      isNewerContainerVersion: {
        containerVersion: topLevelContainerVersion,
        descriptor: 'myapp:android:17.14.0',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isNewerContainerVersion] Should not log error and nor exit process for newer container version [string]', async () => {
    await logErrorAndExitIfNotSatisfied({
      isNewerContainerVersion: {
        containerVersion: '2.2.2',
        descriptor: 'myapp:android:17.14.0',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isNewerContainerVersion] Should not log error and nor exit process for newer container version', async () => {
    await logErrorAndExitIfNotSatisfied({
      isNewerContainerVersion: {
        containerVersion: '2.2.2',
        descriptor: AppVersionDescriptor.fromString('myapp:android:17.14.0'),
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  fixtures.withGitOrFileSystemPath.forEach(obj => {
    it('[noGitOrFilesystemPath] Should log error and exit process if path is/contains a git or file system scheme', async () => {
      await logErrorAndExitIfNotSatisfied({
        noGitOrFilesystemPath: { obj },
      })
      assertLoggedErrorAndExitedProcess()
    })
  })

  fixtures.withoutGitOrFileSystemPath.forEach(obj => {
    it('[noGitOrFilesystemPath] Should not log error not exit process if path is not/ does not contain a git or file system scheme', async () => {
      await logErrorAndExitIfNotSatisfied({
        noGitOrFilesystemPath: { obj },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })
  })

  fixtures.withFileSystemPath.forEach(obj => {
    it('[noFileSystemPath] Should log error and exit process if path is/contains a file system scheme', async () => {
      await logErrorAndExitIfNotSatisfied({
        noFileSystemPath: { obj },
      })
      assertLoggedErrorAndExitedProcess()
    })
  })

  fixtures.withoutFileSystemPath.forEach(obj => {
    it('[noFileSystemPath] Should not log error not exit process if path is not/ does not contain a  file system scheme', async () => {
      await logErrorAndExitIfNotSatisfied({
        noFileSystemPath: { obj },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })
  })

  /*it('[cauldronIsActive] Shoud log error and exit process if cauldron is not active', async () => {
      isActiveStub.returns(false)
      await logErrorAndExitIfNotSatisfied({
        cauldronIsActive: {}
      })
      assertLoggedErrorAndExitedProcess()
    })

    it('[cauldronIsActive] Shoud not log error not exit process if cauldron is active', async () => {
      isActiveStub.returns(true)
      await logErrorAndExitIfNotSatisfied({
        cauldronIsActive: {}
      })
      assertNoErrorLoggedAndNoProcessExit()
    })*/

  fixtures.validNpmPackageNames.forEach(name => {
    it('[isValidPackageName] Should not log error nor exit process if package name is valid', async () => {
      await logErrorAndExitIfNotSatisfied({
        isValidNpmPackageName: { name },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })
  })

  fixtures.invalidNpmPackageNames.forEach(name => {
    it('[isValidPackageName] Should log error and exit process if package name is invalid', async () => {
      await logErrorAndExitIfNotSatisfied({
        isValidNpmPackageName: { name },
      })
      assertLoggedErrorAndExitedProcess()
    })
  })

  fixtures.validElectrodeNativeModuleNames.forEach(name => {
    it('[isValidElectrodeNativeModuleName] Should not log error nor exit process if module name is valid', async () => {
      await logErrorAndExitIfNotSatisfied({
        isValidElectrodeNativeModuleName: { name },
      })
      assertNoErrorLoggedAndNoProcessExit()
    })
  })

  fixtures.invalidElectrodeNativeModuleNames.forEach(name => {
    it('[isValidElectrodeNativeModuleName] Should log error and exit process if module name is invalid', async () => {
      await logErrorAndExitIfNotSatisfied({
        isValidElectrodeNativeModuleName: { name },
      })
      assertLoggedErrorAndExitedProcess()
    })
  })

  it('[sameNativeApplicationAndPlatform] Should log error and exit process if descriptors do not all match same native application platform', async () => {
    await logErrorAndExitIfNotSatisfied({
      sameNativeApplicationAndPlatform: {
        descriptors: fixtures.differentNativeApplicationPlatformDescriptors,
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[sameNativeApplicationAndPlatform] Should not log error anornd exit process if descriptors do not all match same native application platform', async () => {
    await logErrorAndExitIfNotSatisfied({
      sameNativeApplicationAndPlatform: {
        descriptors: fixtures.sameNativeApplicationPlatformDescriptors,
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[checkIfCodePushOptionsAreValid] Should log error and exit process if targetBinaryVersion is specified with more than 1 descriptor ', async () => {
    await logErrorAndExitIfNotSatisfied({
      checkIfCodePushOptionsAreValid: {
        descriptors: fixtures.differentNativeApplicationPlatformDescriptors,
        targetBinaryVersion: '1.1.0',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[checkIfCodePushOptionsAreValid] Should not log error and exit process if targetBinaryVersion is specified with more than 1 descriptor ', async () => {
    await logErrorAndExitIfNotSatisfied({
      checkIfCodePushOptionsAreValid: {
        descriptors: ['testapp:android:1.0.0'],
        targetBinaryVersion: '1.1.0',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[checkIfCodePushOptionsAreValid] Should log error and exit process if targetBinaryVersion & semVerDescriptor are specified ', async () => {
    await logErrorAndExitIfNotSatisfied({
      checkIfCodePushOptionsAreValid: {
        descriptors: ['testapp:android:1.0.0'],
        semVerDescriptor: '~1.1.0',
        targetBinaryVersion: '1.1.0',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[checkIfCodePushOptionsAreValid] Should not log error and exit process if more than 1 descriptor and semVerDescriptor are specified', async () => {
    await logErrorAndExitIfNotSatisfied({
      checkIfCodePushOptionsAreValid: {
        descriptors: fixtures.differentNativeApplicationPlatformDescriptors,
        semVerDescriptor: '~1.1.0',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[pathExist] Should not log error nor exit if path exists', async () => {
    const tmpDirPath = createTmpDir()
    await logErrorAndExitIfNotSatisfied({
      pathExist: {
        p: tmpDirPath,
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[pathExist] Should log error and exist if path does not exist', async () => {
    await logErrorAndExitIfNotSatisfied({
      pathExist: {
        p: '/non/existing/path',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isFilePath] Should log error and exist if path is not a file path', async () => {
    const tmpDirPath = createTmpDir()
    await logErrorAndExitIfNotSatisfied({
      isFilePath: {
        p: tmpDirPath,
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isFilePath] Should log error and exist if path does not exist', async () => {
    await logErrorAndExitIfNotSatisfied({
      isFilePath: {
        p: '/non/existing/path',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isDirectoryPath] Should not log error nor exist if path is a directory path', async () => {
    const tmpDirPath = createTmpDir()
    await logErrorAndExitIfNotSatisfied({
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
    await logErrorAndExitIfNotSatisfied({
      isDirectoryPath: {
        p: tmpFilePath,
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isDirectoryPath] Should log error and exit if path does not exists', async () => {
    await logErrorAndExitIfNotSatisfied({
      isDirectoryPath: {
        p: '/non/existing/path',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isValidPlatformConfig] Should log error and exit if key is not whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'keyNotWhiteListed',
      },
    })
    assertLoggedErrorAndExitedProcess()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'showBanner',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'logLevel',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'tmp-dir',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'retain-tmp-dir',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'codePushAccessKey',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'overrideManifestUrlModifier',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'bundleStoreProxy',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })

  it('[isValidPlatformConfig] Should not log error and nor exit if key is whitelisted', async () => {
    await logErrorAndExitIfNotSatisfied({
      isValidPlatformConfig: {
        key: 'sourceMapStoreProxy',
      },
    })
    assertNoErrorLoggedAndNoProcessExit()
  })
})

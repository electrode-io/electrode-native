import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api'
import { AppVersionDescriptor, PackagePath, Platform } from 'ern-core'
import * as core from 'ern-core'
import * as cauldronApi from 'ern-cauldron-api'
import * as publisher from 'ern-container-publisher'
import * as launch from '../src/launchRunner'
import * as getRun from '../src/getRunnerGeneratorForPlatform'
import { doesThrow, fixtures } from 'ern-util-dev'
import * as gen from '../src/generateContainerForRunner'
import { AndroidRunnerGenerator } from 'ern-runner-gen-android'
import { runMiniApp } from '../src/runMiniApp'
import { assert, expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import path from 'path'

const sandbox = sinon.createSandbox()

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture))
}

function createCauldronApi(cauldronDocument) {
  return new CauldronApi(
    new InMemoryDocumentStore(cauldronDocument),
    new EphemeralFileStore()
  )
}

function createCauldronHelper(cauldronDocument) {
  return new CauldronHelper(createCauldronApi(cauldronDocument))
}

const testAndroid1770Descriptor = AppVersionDescriptor.fromString(
  'test:android:17.7.0'
)

describe('runMiniApp', () => {
  let launchRunnerStub
  let generateContainerForRunnerStub
  let publishContainerStub
  let getRunnerGeneratorForPlatformStub
  let startPackagerStub
  let androidRunnerGenStub

  beforeEach(() => {
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixtures.defaultCauldron))
    sandbox.stub(core.MiniApp, 'fromCurrentPath').returns({ name: 'myMiniApp' })
    sandbox.stub(core.MiniApp, 'fromPath').returns({ name: 'myMiniApp' })
    startPackagerStub = sandbox.stub(
      core.reactnative,
      'startPackagerInNewWindow'
    )
    sandbox.stub(core.shell)

    launchRunnerStub = sandbox.stub(launch, 'launchRunner')
    generateContainerForRunnerStub = sandbox
      .stub(gen, 'generateContainerForRunner')
      .resolves({
        config: {
          composite: {
            getNativeDependencies: () =>
              Promise.resolve({
                all: [
                  {
                    packagePath: PackagePath.fromString('react-native@0.59.8'),
                  },
                ],
                apis: [],
                nativeApisImpl: [],
                thirdPartyInManifest: [],
                thirdPartyNotInManifest: [],
              }),
            path: path.join(__dirname, 'fixtures'),
          },
        },
      })
    publishContainerStub = sandbox.stub(publisher, 'publishContainer')
    androidRunnerGenStub = sandbox.createStubInstance(AndroidRunnerGenerator)
    getRunnerGeneratorForPlatformStub = sandbox
      .stub(getRun, 'getRunnerGeneratorForPlatform')
      .returns(androidRunnerGenStub)
  })

  afterEach(() => {
    sandbox.restore()
  })

  function prepareStubs({
    existsSyncReturn = true,
    miniAppExistInPath = true,
  }: {
    existsSyncReturn?: boolean
    miniAppExistInPath?: boolean
  } = {}) {
    sandbox
      .stub(fs, 'existsSync')
      .callsFake(p =>
        p.toString().endsWith('RunnerConfig.java') ? false : existsSyncReturn
      )
    sandbox.stub(core.MiniApp, 'existInPath').returns(miniAppExistInPath)
  }

  it('should throw if miniapps are provided but not the name of the main miniapp to launch [no local miniapp]', async () => {
    prepareStubs({ miniAppExistInPath: false })
    assert(
      await doesThrow(runMiniApp, null, 'android', {
        miniapps: [
          PackagePath.fromString('myMiniAppA@1.0.0'),
          PackagePath.fromString('myMiniAppB@1.0.0'),
        ],
      })
    )
  })

  it('should throw if js api implementations are provided along with a descriptor', async () => {
    prepareStubs()
    assert(
      await doesThrow(runMiniApp, null, 'android', {
        descriptor: testAndroid1770Descriptor,
        jsApiImpls: [PackagePath.fromString('jsapiimpl@1.0.0')],
      })
    )
  })

  it('should throw if miniapps are provided along with a descriptor', async () => {
    prepareStubs()
    assert(
      await doesThrow(runMiniApp, null, 'android', {
        descriptor: testAndroid1770Descriptor,
        mainMiniAppName: 'myMiniAppA',
        miniapps: [
          PackagePath.fromString('myMiniAppA@1.0.0'),
          PackagePath.fromString('myMiniAppB@1.0.0'),
        ],
      })
    )
  })

  it('should not start react native packager if dev mode is disabled [local single miniapp]', async () => {
    prepareStubs()
    await runMiniApp('android', { dev: false })
    sandbox.assert.notCalled(startPackagerStub)
  })

  it('should start react native packager if dev mode is enabled [local single miniapp]', async () => {
    prepareStubs()
    await runMiniApp('android', { dev: true })
    sandbox.assert.calledOnce(startPackagerStub)
  })

  it('should start react native packager with host if provided [local single miniapp]', async () => {
    prepareStubs()
    await runMiniApp('android', { dev: true, host: '192.168.1.1' })
    sandbox.assert.calledWith(startPackagerStub, {
      cwd: sinon.match.string,
      host: '192.168.1.1',
      port: undefined,
    })
  })

  it('should start react native packager with port if provided [local single miniapp]', async () => {
    prepareStubs()
    await runMiniApp('android', { dev: true, port: '1234' })
    sandbox.assert.calledWith(startPackagerStub, {
      cwd: sinon.match.string,
      host: undefined,
      port: '1234',
    })
  })

  it('should generate container for runner [local single miniapp]', async () => {
    prepareStubs()
    await runMiniApp('android')
    sandbox.assert.calledWith(generateContainerForRunnerStub, 'android', {
      baseComposite: undefined,
      extra: undefined,
      jsApiImpls: undefined,
      jsMainModuleName: 'index.android',
      miniApps: sinon.match.array,
      napDescriptor: undefined,
      outDir: sinon.match.string,
    })
  })

  it('should publish the container to maven local [local single miniapp - android]', async () => {
    prepareStubs()
    await runMiniApp('android')
    sandbox.assert.calledWith(publishContainerStub, {
      containerPath: sinon.match.string,
      containerVersion: '1.0.0',
      extra: {
        artifactId: 'runner-ern-container-myminiapp',
        groupId: 'com.walmartlabs.ern',
        packageFilePath: 'com/walmartlabs/ern/myminiapp',
        packageName: 'com.walmartlabs.ern.myminiapp',
      },
      platform: 'android',
      publisher: sinon.match.any,
      url: sinon.match.string,
    })
  })

  it('should only regenerate the runner config if runner project already exists [local single miniapp]', async () => {
    prepareStubs({ existsSyncReturn: true })
    await runMiniApp('android')
    sandbox.assert.calledWith(androidRunnerGenStub.regenerateRunnerConfig, {
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-myminiapp',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/myminiapp',
          packageName: 'com.walmartlabs.ern.myminiapp',
        },
        containerGenWorkingDir: Platform.containerGenDirectory,
      },
      mainMiniAppName: 'myMiniApp',
      outDir: sinon.match.string,
      reactNativeDevSupportEnabled: undefined,
      reactNativePackagerHost: undefined,
      reactNativePackagerPort: undefined,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'android',
    })
  })

  it('should only regenerate the runner config if runner project already exists [local single miniapp] with android build config', async () => {
    prepareStubs({ existsSyncReturn: true })
    await runMiniApp('android', {
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-myminiapp',
          compileSdkVersion: '28',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/myminiapp',
          packageName: 'com.walmartlabs.ern.myminiapp',
        },
      },
    })
    sandbox.assert.calledWith(androidRunnerGenStub.regenerateRunnerConfig, {
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-myminiapp',
          compileSdkVersion: '28',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/myminiapp',
          packageName: 'com.walmartlabs.ern.myminiapp',
        },
        containerGenWorkingDir: Platform.containerGenDirectory,
      },
      mainMiniAppName: 'myMiniApp',
      outDir: sinon.match.string,
      reactNativeDevSupportEnabled: undefined,
      reactNativePackagerHost: undefined,
      reactNativePackagerPort: undefined,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'android',
    })
  })

  it('should disable dev support if miniapps are provided', async () => {
    prepareStubs({ existsSyncReturn: true, miniAppExistInPath: false })

    await runMiniApp('android', {
      dev: true,
      mainMiniAppName: 'myMiniAppA',
      miniapps: [
        PackagePath.fromString('myMiniAppA@1.0.0'),
        PackagePath.fromString('myMiniAppB@1.0.0'),
      ],
    })

    sandbox.assert.calledWith(androidRunnerGenStub.regenerateRunnerConfig, {
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-myminiappa',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/myminiappa',
          packageName: 'com.walmartlabs.ern.myminiappa',
        },
        containerGenWorkingDir: Platform.containerGenDirectory,
      },
      mainMiniAppName: 'myMiniAppA',
      outDir: sinon.match.string,
      reactNativeDevSupportEnabled: false,
      reactNativePackagerHost: undefined,
      reactNativePackagerPort: undefined,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'android',
    })
  })

  it('should use local miniapp name if miniapps are provided and local miniapp exist', async () => {
    prepareStubs({ existsSyncReturn: true, miniAppExistInPath: true })

    await runMiniApp('android', {
      miniapps: [
        PackagePath.fromString('myMiniAppA@1.0.0'),
        PackagePath.fromString('myMiniAppB@1.0.0'),
      ],
    })

    sandbox.assert.calledWith(androidRunnerGenStub.regenerateRunnerConfig, {
      extra: {
        androidConfig: {
          artifactId: 'runner-ern-container-myminiapp',
          groupId: 'com.walmartlabs.ern',
          packageFilePath: 'com/walmartlabs/ern/myminiapp',
          packageName: 'com.walmartlabs.ern.myminiapp',
        },
        containerGenWorkingDir: Platform.containerGenDirectory,
      },
      mainMiniAppName: 'myMiniApp',
      outDir: sinon.match.string,
      reactNativeDevSupportEnabled: undefined,
      reactNativePackagerHost: undefined,
      reactNativePackagerPort: undefined,
      reactNativeVersion: '0.59.8',
      targetPlatform: 'android',
    })
  })
})

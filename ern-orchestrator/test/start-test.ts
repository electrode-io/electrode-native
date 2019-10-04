import start from '../src/start'
import { assert } from 'chai'
import sinon from 'sinon'
import chokidar from 'chokidar'
import * as core from 'ern-core'
import { fixtures, doesThrow } from 'ern-util-dev'
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api'
import * as cauldronApi from 'ern-cauldron-api'
import * as compositeGen from 'ern-composite-gen'
import fs from 'fs-extra'
import path from 'path'
import ncp from 'ncp'
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

const testAndroid1770Descriptor = core.AppVersionDescriptor.fromString(
  'test:android:17.7.0'
)

class FakeWatcher {
  private callbacks: Map<string, (file: string) => void> = new Map()
  public on(event: string, cb: (file: string) => void) {
    this.callbacks.set(event, cb)
    return this
  }

  public raiseEvent(event: string, arg: string) {
    this.callbacks.get(event)!(arg)
  }
}

describe('start', () => {
  let generateCompositeStub
  let chokidarWatchStub
  let fakeWatcherInstance
  let shellStub

  beforeEach(() => {
    fakeWatcherInstance = new FakeWatcher()
    chokidarWatchStub = sandbox
      .stub(chokidar, 'watch')
      .returns(fakeWatcherInstance)
    shellStub = sandbox.stub(core.shell)
    generateCompositeStub = sandbox.stub(compositeGen, 'generateComposite')
    sandbox.stub(core.android, 'runAndroidApk')
    sandbox.stub(core.reactnative)
    sandbox
      .stub(core.ErnBinaryStore.prototype, 'getBinary')
      .resolves('/path/to/binary')
    sandbox.stub(core, 'createTmpDir').returns('/tmp/dir')
    sandbox.stub(process.stdin, 'resume')
    sandbox.stub(fs, 'existsSync').returns(true)
    sandbox.stub(ncp, 'ncp').callsFake((source, dest, options, cb) => cb())
  })

  function createStubs({
    getActiveCauldronReturn,
    hasBinaryReturn = false,
    configMiniAppsLinks = {},
  }: {
    getActiveCauldronReturn?: any
    hasBinaryReturn?: boolean
    configMiniAppsLinks?: any
  } = {}) {
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(getActiveCauldronReturn)
    sandbox
      .stub(core.ErnBinaryStore.prototype, 'hasBinary')
      .resolves(hasBinaryReturn)
    const configStub = sandbox.stub(core.config, 'getValue')
    configStub.withArgs('tmp-dir').returns(undefined)
    configStub.withArgs('miniAppsLinks').returns(configMiniAppsLinks)
  }

  afterEach(() => {
    sandbox.restore()
  })

  it('should throw if a descriptor is provided but no Cauldron is active', async () => {
    createStubs({ getActiveCauldronReturn: undefined })
    assert(
      await doesThrow(start, null, { descriptor: testAndroid1770Descriptor })
    )
  })

  it('should throw if no descriptor nor MiniApps are provided', async () => {
    createStubs({
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })
    assert(await doesThrow(start, null, {}))
  })

  it('should work when provided with MiniApps', async () => {
    createStubs({
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      miniapps: [core.PackagePath.fromString('MiniApp@1.0.0')],
    })
  })

  it('should work when provided with a descriptor [with no binary available]', async () => {
    createStubs({
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })
  })

  it('should work when provided with an Android descriptor and an Android package name [with a binary available]', async () => {
    createStubs({
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
      hasBinaryReturn: true,
    })

    await start({
      descriptor: testAndroid1770Descriptor,
      packageName: 'com.mycompany.myapp',
    })
  })

  it('should call generateComposite', async () => {
    createStubs({
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })
    sandbox.assert.calledOnce(generateCompositeStub)
  })

  it('should watch all linked MiniApps directories', async () => {
    createStubs({
      configMiniAppsLinks: { myMiniApp: '/path/to/myMiniApp' },
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })

    sandbox.assert.calledWith(chokidarWatchStub, '/path/to/myMiniApp', {
      cwd: '/path/to/myMiniApp',
      ignoreInitial: true,
      ignored: ['android/**', 'ios/**', 'node_modules/**', '.git/**'],
      persistent: true,
    })
  })

  it('should copy added file to composite working directory', async () => {
    createStubs({
      configMiniAppsLinks: { myMiniApp: '/path/to/myMiniApp' },
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })

    fakeWatcherInstance.raiseEvent('add', 'fileName')

    sandbox.assert.calledWith(
      shellStub.cp,
      path.normalize('/path/to/myMiniApp/fileName'),
      path.normalize('/tmp/dir/node_modules/myMiniApp/fileName')
    )
  })

  it('should copy changed file to composite working directory', async () => {
    createStubs({
      configMiniAppsLinks: { myMiniApp: '/path/to/myMiniApp' },
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })

    fakeWatcherInstance.raiseEvent('change', 'fileName')

    sandbox.assert.calledWith(
      shellStub.cp,
      path.normalize('/path/to/myMiniApp/fileName'),
      path.normalize('/tmp/dir/node_modules/myMiniApp/fileName')
    )
  })

  it('should remove deleted file from composite working directory', async () => {
    createStubs({
      configMiniAppsLinks: { myMiniApp: '/path/to/myMiniApp' },
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })

    fakeWatcherInstance.raiseEvent('unlink', 'fileName')

    sandbox.assert.calledWith(
      shellStub.rm,
      path.normalize('/tmp/dir/node_modules/myMiniApp/fileName')
    )
  })

  it('should create a new directory in composite working directory', async () => {
    createStubs({
      configMiniAppsLinks: { myMiniApp: '/path/to/myMiniApp' },
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })

    fakeWatcherInstance.raiseEvent('addDir', 'fileName')

    sandbox.assert.calledWith(
      shellStub.mkdir,
      path.normalize('/tmp/dir/node_modules/myMiniApp/fileName')
    )
  })

  it('should remove a deleted directory from composite working directory', async () => {
    createStubs({
      configMiniAppsLinks: { myMiniApp: '/path/to/myMiniApp' },
      getActiveCauldronReturn: createCauldronHelper(
        cloneFixture(fixtures.defaultCauldron)
      ),
    })

    await start({
      descriptor: testAndroid1770Descriptor,
    })

    fakeWatcherInstance.raiseEvent('unlinkDir', 'fileName')

    sandbox.assert.calledWith(
      shellStub.rm,
      '-rf',
      path.normalize('/tmp/dir/node_modules/myMiniApp/fileName')
    )
  })
})

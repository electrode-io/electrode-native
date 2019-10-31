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
  let tmpDir

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
    tmpDir = core.createTmpDir()
    sandbox.stub(core, 'createTmpDir').returns('/tmp/dir')
    sandbox.stub(process.stdin, 'resume')
    sandbox.stub(fs, 'existsSync').returns(true)
    sandbox.stub(ncp, 'ncp').callsFake((source, dest, options, cb) => cb())
  })

  function createStubs({
    getActiveCauldronReturn,
    hasBinaryReturn = false,
    packageLinks = {},
  }: {
    getActiveCauldronReturn?: any
    hasBinaryReturn?: boolean
    packageLinks?: any
  } = {}) {
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(getActiveCauldronReturn)
    sandbox
      .stub(core.ErnBinaryStore.prototype, 'hasBinary')
      .resolves(hasBinaryReturn)
    const configStub = sandbox.stub(core.config, 'get')
    configStub.withArgs('tmp-dir').returns(undefined)

    const configPackageLinksStub = sandbox.stub(
      core.packageLinksConfig,
      'getAll'
    )
    configPackageLinksStub.returns(packageLinks)
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
})

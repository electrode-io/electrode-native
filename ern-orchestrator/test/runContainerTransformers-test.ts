import { runContainerTransformers } from '../src/runContainerTransformers'
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api'
import { NativeApplicationDescriptor } from 'ern-core'
import { doesThrow, fixtures } from 'ern-util-dev'
import * as cauldronApi from 'ern-cauldron-api'
import { assert, expect } from 'chai'
import sinon from 'sinon'
import * as containerTransformer from 'ern-container-transformer'
import jp from 'jsonpath'

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

describe('runContainerTransformers', () => {
  let transformContainerStub

  beforeEach(() => {
    transformContainerStub = sandbox.stub(
      containerTransformer,
      'transformContainer'
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should throw if the descriptor is partial', async () => {
    assert(
      await doesThrow(runContainerTransformers, null, {
        containerPath: '/Users/foo/test',
        containerVersion: '1.0.0',
        napDescriptor: NativeApplicationDescriptor.fromString('test:android'),
      })
    )
  })

  it('should call transformContainer only with enabled transformers', async () => {
    const fixture = cloneFixture(fixtures.defaultCauldron)
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixture))
    await runContainerTransformers({
      containerPath: '/Users/foo/test',
      napDescriptor: NativeApplicationDescriptor.fromString(
        'test:android:17.7.0'
      ),
    })
    sandbox.assert.calledWith(transformContainerStub, {
      containerPath: '/Users/foo/test',
      extra: undefined,
      platform: 'android',
      transformer: 'dummy-1',
    })
    sandbox.assert.calledWith(transformContainerStub, {
      containerPath: '/Users/foo/test',
      extra: undefined,
      platform: 'android',
      transformer: 'dummy-3',
    })
  })
})

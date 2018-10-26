import { runContainerPublishers } from '../src/runContainerPublishers'
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
import * as containerPublisher from 'ern-container-publisher'
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

describe('runContainerPublishers', () => {
  let publishContainerStub

  beforeEach(() => {
    publishContainerStub = sandbox.stub(containerPublisher, 'publishContainer')
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should throw if the descriptor is partial', async () => {
    assert(
      await doesThrow(runContainerPublishers, null, {
        containerPath: '/Users/foo/test',
        containerVersion: '1.0.0',
        napDescriptor: NativeApplicationDescriptor.fromString('test:android'),
      })
    )
  })

  it('should call publishContainer for each publisher', async () => {
    const fixture = cloneFixture(fixtures.defaultCauldron)
    sandbox
      .stub(cauldronApi, 'getActiveCauldron')
      .resolves(createCauldronHelper(fixture))
    await runContainerPublishers({
      containerPath: '/Users/foo/test',
      containerVersion: '1000.0.0',
      napDescriptor: NativeApplicationDescriptor.fromString(
        'test:android:17.7.0'
      ),
    })
    sandbox.assert.calledTwice(publishContainerStub)
  })
})

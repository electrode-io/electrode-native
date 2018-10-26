import { getBinaryStoreFromCauldron } from '../src/getBinaryStoreFromCauldron'
import { expect, assert } from 'chai'
import { doesThrow, fixtures } from 'ern-util-dev'
import { ErnBinaryStore } from 'ern-core'
import {
  CauldronApi,
  CauldronHelper,
  EphemeralFileStore,
  InMemoryDocumentStore,
} from 'ern-cauldron-api'
import * as cauldronApi from 'ern-cauldron-api'
import sinon from 'sinon'

const sandbox = sinon.createSandbox()

function createCauldronApi(cauldronDocument) {
  return new CauldronApi(
    new InMemoryDocumentStore(cauldronDocument),
    new EphemeralFileStore()
  )
}

function createCauldronHelper(cauldronDocument) {
  return new CauldronHelper(createCauldronApi(cauldronDocument))
}

function cloneFixture(fixture) {
  return JSON.parse(JSON.stringify(fixture))
}

describe('getBinaryStoreFromCauldron', () => {
  afterEach(() => {
    sandbox.restore()
  })

  it('should throw if cauldron does not contain a binary store config', async () => {
    const fixture = cloneFixture(fixtures.defaultCauldron)
    delete fixture.config.binaryStore
    const cauldronHelper = createCauldronHelper(fixture)
    sandbox.stub(cauldronApi, 'getActiveCauldron').resolves(cauldronHelper)
    assert(await doesThrow(getBinaryStoreFromCauldron, null))
  })

  it('should return a binary store instance', async () => {
    const fixture = cloneFixture(fixtures.defaultCauldron)
    const cauldronHelper = createCauldronHelper(fixture)
    sandbox.stub(cauldronApi, 'getActiveCauldron').resolves(cauldronHelper)
    const result = await getBinaryStoreFromCauldron()
    expect(result).instanceOf(ErnBinaryStore)
  })
})

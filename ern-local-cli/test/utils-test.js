import {
  assert,
  expect
} from 'chai'
import {
  cauldron
} from 'ern-core'
import sinon from 'sinon'
import utils from '../src/lib/utils'

const basicCauldronFixture = require('./fixtures/cauldron.json')
const emptyCauldronFixture = require('./fixtures/empty-cauldron.json')
const getAllNativeAppsStub = sinon.stub(cauldron, 'getAllNativeApps')

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
})
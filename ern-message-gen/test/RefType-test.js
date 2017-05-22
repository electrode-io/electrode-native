import RefType from '../src/models/refs/RefType'
import {expect} from 'chai'

describe('RefType', function () {
  it('should match name', function () {
    expect(RefType.forValue('DEFINITION')).to.eql(RefType.DEFINITION)
  })
})

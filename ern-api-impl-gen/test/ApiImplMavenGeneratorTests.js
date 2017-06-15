import ApiImplMavenGenerator from '../src/generators/android/ApiImplMavenGenerator'
import { assert } from 'chai'

describe('ApiImplMavenGenerator', () => {
  it('should create ApiImplMavenGenerator object', () => {
    const obj = new ApiImplMavenGenerator()
    assert.isNotNull(obj, 'should create a non null object')
  })
})

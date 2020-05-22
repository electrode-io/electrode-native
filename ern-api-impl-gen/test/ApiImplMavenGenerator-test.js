import ApiImplAndroidGenerator from '../src/generators/android/ApiImplAndroidGenerator'
import { assert } from 'chai'
import { afterTest, beforeTest } from 'ern-util-dev'

describe('ApiImplAndroidGenerator', () => {
  beforeEach(() => {
    beforeTest()
  })

  afterEach(() => {
    afterTest()
  })

  it('should create ApiImplAndroidGenerator object', () => {
    const obj = new ApiImplAndroidGenerator()
    assert.isNotNull(obj, 'should create a non null object')
  })
})

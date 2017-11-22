import ApiImplAndroidGenerator from '../src/generators/android/ApiImplAndroidGenerator'
import { assert } from 'chai'

import {
  coloredLog
} from 'ern-util'

global.log = coloredLog

describe('ApiImplAndroidGenerator', () => {
  it('should create ApiImplAndroidGenerator object', () => {
    const obj = new ApiImplAndroidGenerator()
    assert.isNotNull(obj, 'should create a non null object')
  })
})

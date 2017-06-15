import ApiImplMavenGenerator from '../src/generators/android/ApiImplMavenGenerator'
import { assert } from 'chai'

import {
  coloredLog
} from '@walmart/ern-util'

global.log = coloredLog

describe('ApiImplMavenGenerator', () => {
  it('should create ApiImplMavenGenerator object', () => {
    const obj = new ApiImplMavenGenerator()
    assert.isNotNull(obj, 'should create a non null object')
  })
})

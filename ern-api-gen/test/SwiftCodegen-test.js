import {expect} from 'chai'
import SwiftCodegen from '../src/languages/SwiftCodegen'

describe('SwiftCodegen', function () {
  it('should normalizePath', function () {
    const out = SwiftCodegen.normalizePath('/path/{foo-bar}/{def_mo}/{g}')
    expect(out).to.eql('/path/{fooBar}/{defMo}/{g}')
  })
})

import DefaultCodegen from '../src/DefaultCodegen'
import { expect } from 'chai'

describe('DefaultCodegen', function() {
  it('should camelize', function() {
    const resp = DefaultCodegen.camelize('A word to camel')
    expect(resp).to.equal('AWordToCamel')
  })
})

import { expect } from 'chai'
import { tagOneLine } from '../src/tagoneline'

describe('tagOneLine', () => {
  it('should use a template tag', () => {
    const world = 'world'
    expect(tagOneLine`hello ${world}`).to.eql('hello world')
  })
})

// @flow

import {
  expect
} from 'chai'
import tagOneLine from '../src/tagoneline'

describe('tagOneLine', function () {
  it('should use a template tag', function () {
    const world = 'world'
    expect(tagOneLine`hello ${world}`).to.eql('hello world')
  })
})

// @flow

import { expect } from 'chai'
import required from '../src/required'

describe('required', () => {
  it('test required', () => {
      try{
        required('param1')
      } catch (e){
        expect(e.message).to.eql('param1 is required')
      }
  })
})
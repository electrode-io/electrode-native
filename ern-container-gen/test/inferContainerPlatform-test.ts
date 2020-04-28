import { inferContainerPlatform } from '../src/inferContainerPlatform'
import { expect } from 'chai'
import path from 'path'

describe('inferContainerPlatform', () => {
  it('should throw if the container path does not exist', () => {
    expect(() => inferContainerPlatform('/does/not/exist')).to.throw()
  })

  it('should return android if the container is an android one', () => {
    const result = inferContainerPlatform(
      path.resolve('../system-tests/fixtures/android-container')
    )
    expect(result).eql('android')
  })

  it('should return android if the container is an ios one', () => {
    const result = inferContainerPlatform(
      path.resolve('../system-tests/fixtures/ios-container')
    )
    expect(result).eql('ios')
  })
})

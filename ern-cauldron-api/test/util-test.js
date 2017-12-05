import {
  assert,
  expect
} from 'chai'
import * as util from '../src/util'
import sinon from 'sinon'

describe('util.js', () => {
  describe('exists', () => {
    it('should return true if the object with given name exists in the collection', () => {
      const result = util.exists(
        [{name: 'walmart'}, {name: 'electrode'}],
        'walmart')
      expect(result).true
    })

    it('should return false if the object with given name does not exist in the collection', () => {
      const result = util.exists(
        [{name: 'walmart'}, {name: 'electrode'}],
        'foo')
      expect(result).false
    })

    it('should return true if the object with given name and version exists in the collection', () => {
      const result = util.exists(
        [{name: 'walmart'}, {name: 'electrode', version: '1.0.0'}],
        'electrode',
        '1.0.0')
      expect(result).true
    })

    it('should return false if the object with given name and version does not exists in the collection', () => {
      const result = util.exists(
        [{name: 'walmart'}, {name: 'electrode', version: '1.0.0'}],
        'electrode',
        '0.0.0')
      expect(result).false
    })
  })

  describe('buildNativeBinaryFileName', () => {
    it('should return the correct file name of Android binary', () => {
      const result = util.buildNativeBinaryFileName('walmart', 'android', '17.7.0')
      expect(result).eql('walmart-android@17.7.0.apk')
    })

    it('should return the correct file name of iOS binary', () => {
      const result = util.buildNativeBinaryFileName('walmart', 'ios', '17.7.0')
      expect(result).eql('walmart-ios@17.7.0.app')
    })
  })

  describe('getNativeBinaryFileExt', () => {
    it('should return the correct file name extension for Android', () => {
      const result = util.getNativeBinaryFileExt('android')
      expect(result).eql('apk')
    })

    it('should return the correct file name extension for iOS', () => {
      const result = util.getNativeBinaryFileExt('ios')
      expect(result).eql('app')
    })
  })
})
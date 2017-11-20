import {
  expect
} from 'chai'
import NativeApplicationDescriptor from '../src/NativeApplicationDescriptor'

describe('NativeApplicationDescriptor', () => {
  describe('constructor', () => {
    it('should instantiate a patial NativeApplicationDescriptor [name]', () => {
      expect(() => new NativeApplicationDescriptor('MyNativeAppName')).to.not.throw()
    })

    it('should instantiate a patial NativeApplicationDescriptor [name:platform]', () => {
      expect(() => new NativeApplicationDescriptor('MyNativeAppName', 'android')).to.not.throw()
    })

    it('should instantiate a complete NativeApplicationDescriptor [name:platform:version]', () => {
      expect(() => new NativeApplicationDescriptor('MyNativeAppName', 'android', '1.2.3')).to.not.throw()
    })

    it('should throw if version is provided but not platform', () => {
      expect(() => new NativeApplicationDescriptor('MyNativeAppName', null, '1.2.3')).to.throw()
    })

    it('should throw if name is not provided', () => {
      expect(() => new NativeApplicationDescriptor(null, 'android', '1.2.3')).to.throw()
    })
  })

  describe('name getter', () => {
    it('should return the native application name', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android', '1.2.3')
      expect(descriptor.name).to.equal('MyNativeAppName')
    })
  })

  describe('platform getter', () => {
    it('should return the native application platform', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android', '1.2.3')
      expect(descriptor.platform).to.equal('android')
    })
  })

  describe('version getter', () => {
    it('should return the native application version', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android', '1.2.3')
      expect(descriptor.version).to.equal('1.2.3')
    })
  })

  describe('isComplete getter', () => {
    it('should return true if the NativeApplicationDescriptor is complete', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android', '1.2.3')
      expect(descriptor.isComplete).true
    })

    it('should return false if the NativeApplicationDescriptor is not complete', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android')
      expect(descriptor.isComplete).false
    })
  })

  describe('isPartial getter', () => {
    it('should return true if the NativeApplicationDescriptor is partial [1]', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android')
      expect(descriptor.isPartial).true
    })

    it('should return true if the NativeApplicationDescriptor is partial [2]', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName')
      expect(descriptor.isPartial).true
    })

    it('should return false if the NativeApplicationDescriptor is not partial', () => {
      const descriptor = new NativeApplicationDescriptor('MyNativeAppName', 'android', '1.2.3')
      expect(descriptor.isPartial).false
    })
  })

  describe('fromString', () => {
    it('should work with a complete NativeApplicationDescriptor litteral', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName:android:1.2.3')
      expect(descriptor.name).to.equal('MyNativeAppName')
      expect(descriptor.platform).to.equal('android')
      expect(descriptor.version).to.equal('1.2.3')
    })

    it('should work with a partial NativeApplicationDescriptor litteral [1]', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName:android')
      expect(descriptor.name).to.equal('MyNativeAppName')
      expect(descriptor.platform).to.equal('android')
    })

    it('should work with a partial NativeApplicationDescriptor litteral [2]', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName')
      expect(descriptor.name).to.equal('MyNativeAppName')
    })
  })

  describe('toString', () => {
    it('should return the correct string [1]', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName:android:1.2.3')
      expect(descriptor.toString()).to.equal('MyNativeAppName:android:1.2.3')
    })

    it('should return the correct string [2]', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName:android')
      expect(descriptor.toString()).to.equal('MyNativeAppName:android')
    })

    it('should return the correct string [3]', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName')
      expect(descriptor.toString()).to.equal('MyNativeAppName')
    })
  })

  describe('withoutVersion', () => {
    it('should create a new native application descriptor without the version', () => {
      const descriptor = NativeApplicationDescriptor.fromString('MyNativeAppName:android:1.2.3')
      const newDescriptor = descriptor.withoutVersion()
      expect(newDescriptor.toString()).to.equal('MyNativeAppName:android')
    })
  })
})

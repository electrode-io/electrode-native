import { expect } from 'chai';
import {
  AppNameDescriptor,
  AppPlatformDescriptor,
  AppVersionDescriptor,
} from '../src/descriptors';

describe('Descriptors', () => {
  describe('constructor', () => {
    it('should instantiate a patial descriptor [name]', () => {
      expect(() => new AppNameDescriptor('MyNativeAppName')).to.not.throw();
    });

    it('should instantiate a partial descriptor [name:platform]', () => {
      expect(
        () => new AppPlatformDescriptor('MyNativeAppName', 'android'),
      ).to.not.throw();
    });

    it('should instantiate a complete descriptor [name:platform:version]', () => {
      expect(
        () => new AppVersionDescriptor('MyNativeAppName', 'android', '1.2.3'),
      ).to.not.throw();
    });
  });

  describe('name getter', () => {
    it('should return the native application name', () => {
      const descriptor = new AppVersionDescriptor(
        'MyNativeAppName',
        'android',
        '1.2.3',
      );
      expect(descriptor.name).to.equal('MyNativeAppName');
    });
  });

  describe('platform getter', () => {
    it('should return the native application platform', () => {
      const descriptor = new AppVersionDescriptor(
        'MyNativeAppName',
        'android',
        '1.2.3',
      );
      expect(descriptor.platform).to.equal('android');
    });
  });

  describe('version getter', () => {
    it('should return the native application version', () => {
      const descriptor = new AppVersionDescriptor(
        'MyNativeAppName',
        'android',
        '1.2.3',
      );
      expect(descriptor.version).to.equal('1.2.3');
    });
  });

  describe('fromString', () => {
    it('should work with a complete descriptor litteral', () => {
      const descriptor = AppVersionDescriptor.fromString(
        'MyNativeAppName:android:1.2.3',
      );
      expect(descriptor.name).to.equal('MyNativeAppName');
      expect(descriptor.platform).to.equal('android');
      expect(descriptor.version).to.equal('1.2.3');
    });

    it('should work with a partial descriptor litteral [1]', () => {
      const descriptor = AppPlatformDescriptor.fromString(
        'MyNativeAppName:android',
      );
      expect(descriptor.name).to.equal('MyNativeAppName');
      expect(descriptor.platform).to.equal('android');
    });

    it('should work with a partial descriptor litteral [2]', () => {
      const descriptor = AppNameDescriptor.fromString('MyNativeAppName');
      expect(descriptor.name).to.equal('MyNativeAppName');
    });
  });

  describe('toString', () => {
    it('should return the correct string [1]', () => {
      const descriptor = AppVersionDescriptor.fromString(
        'MyNativeAppName:android:1.2.3',
      );
      expect(descriptor.toString()).to.equal('MyNativeAppName:android:1.2.3');
    });

    it('should return the correct string [2]', () => {
      const descriptor = AppPlatformDescriptor.fromString(
        'MyNativeAppName:android',
      );
      expect(descriptor.toString()).to.equal('MyNativeAppName:android');
    });

    it('should return the correct string [3]', () => {
      const descriptor = AppNameDescriptor.fromString('MyNativeAppName');
      expect(descriptor.toString()).to.equal('MyNativeAppName');
    });
  });
});

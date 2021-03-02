import { expect } from 'chai';
import { API, JS_API_IMPL, MINIAPP, NATIVE_API_IMPL } from '../src/ModuleTypes';
import { validateModuleName } from '../src/validateModuleName';

describe('validateModuleName', () => {
  const ALL_MODULE_TYPES = [API, JS_API_IMPL, MINIAPP, NATIVE_API_IMPL];

  it('should return false if module name is empty', () => {
    ALL_MODULE_TYPES.forEach((moduleType) => {
      expect(validateModuleName('', moduleType)).to.be.false;
    });
  });

  it('should return false if module name is missing suffix', () => {
    ALL_MODULE_TYPES.forEach((moduleType) => {
      expect(validateModuleName('test', moduleType)).to.be.false;
    });
  });

  it('should return false if module name is invalid', () => {
    expect(validateModuleName('1test-api', API)).to.be.false;
  });

  it('should return false if module name contains uppercase chars', () => {
    expect(validateModuleName('Test-api', API)).to.be.false;
  });

  it('should return false if module type is not supported', () => {
    expect(validateModuleName('test', 'unsupported')).to.be.false;
  });

  it('should return true if miniapp module name contains suffix', () => {
    expect(validateModuleName('test-miniapp', MINIAPP)).to.be.true;
  });

  it('should return true if miniapp module name contains suffix', () => {
    expect(validateModuleName('test123-miniapp', MINIAPP)).to.be.true;
  });

  it('should return true if api module name contains suffix', () => {
    expect(validateModuleName('test-api', API)).to.be.true;
  });

  it('should return true if (js) api-impl module name contains suffix', () => {
    const validSuffixes = ['-api-impl', '-api-impl-js'];
    validSuffixes.forEach((suffix) => {
      expect(validateModuleName(`test${suffix}`, JS_API_IMPL)).to.be.true;
    });
  });

  it('should return true if (native) api-impl module name contains suffix', () => {
    const validSuffixes = ['-api-impl', '-api-impl-native'];
    validSuffixes.forEach((suffix) => {
      expect(validateModuleName(`test${suffix}`, NATIVE_API_IMPL)).to.be.true;
    });
  });
});

import { expect } from 'chai';
import * as fixtures from './fixtures/common';
import * as ModuleTypes from '../src/ModuleTypes';
import { validateModuleName } from '../src/validateModuleName';

describe('validateModuleName', () => {
  const ALL_MODULE_TYPES = [
    ModuleTypes.MINIAPP,
    ModuleTypes.API,
    ModuleTypes.JS_API_IMPL,
    ModuleTypes.NATIVE_API_IMPL,
  ];

  it('should return false if module name is empty', () => {
    ALL_MODULE_TYPES.forEach((moduleType) => {
      const result = validateModuleName('', moduleType);
      expect(result).to.be.false;
    });
  });

  it('should return false if module name is missing suffix', () => {
    ALL_MODULE_TYPES.forEach((moduleType) => {
      const result = validateModuleName('chai', moduleType);
      expect(result).to.be.false;
    });
  });

  it('should return false if module name is invalid', () => {
    const result = validateModuleName('1chai-api', ModuleTypes.API);
    expect(result).to.be.false;
  });

  it('should return false if module name contains uppercase chars', () => {
    const result = validateModuleName('Chai-api', ModuleTypes.API);
    expect(result).to.be.false;
  });

  it('should return false if module type is not supported', () => {
    const result = validateModuleName('chai', fixtures.moduleTypeNotSupported);
    expect(result).to.be.false;
  });

  it('should return true if miniapp module name contains suffix', () => {
    const result = validateModuleName('test-miniapp', ModuleTypes.MINIAPP);
    expect(result).to.be.true;
  });

  it('should return true if miniapp module name contains suffix', () => {
    const result = validateModuleName('test123-miniapp', ModuleTypes.MINIAPP);
    expect(result).to.be.true;
  });

  it('should return true if api module name contains suffix', () => {
    const result = validateModuleName('test-api', ModuleTypes.API);
    expect(result).to.be.true;
  });

  it('should return true if (js) api-impl module name contains suffix', () => {
    const validSuffixes = ['-api-impl', '-api-impl-js'];
    validSuffixes.forEach((suffix) => {
      const result = validateModuleName(
        `test${suffix}`,
        ModuleTypes.JS_API_IMPL,
      );
      expect(result).to.be.true;
    });
  });

  it('should return true if (native) api-impl module name contains suffix', () => {
    const validSuffixes = ['-api-impl', '-api-impl-native'];
    validSuffixes.forEach((suffix) => {
      const result = validateModuleName(
        `test${suffix}`,
        ModuleTypes.NATIVE_API_IMPL,
      );
      expect(result).to.be.true;
    });
  });
});

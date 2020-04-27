import { expect } from 'chai';
import * as fixtures from './fixtures/common';
import * as ModuleTypes from '../src/ModuleTypes';
import { checkIfModuleNameContainsSuffix } from '../src/checkIfModuleNameContainsSuffix';

describe('checkIfModuleNameContainsSuffix', () => {
  it('should return false if module name of mini-app does not contain suffix', () => {
    const result = checkIfModuleNameContainsSuffix(
      fixtures.pkgName,
      ModuleTypes.MINIAPP,
    );
    expect(result).to.be.false;
  });

  it('should return false if module name of api does not contain suffix', () => {
    const result = checkIfModuleNameContainsSuffix(
      fixtures.pkgName,
      ModuleTypes.API,
    );
    expect(result).to.be.false;
  });

  it('should return false if module name of (js) api-impl does not contain suffix', () => {
    const result = checkIfModuleNameContainsSuffix(
      fixtures.pkgName,
      ModuleTypes.JS_API_IMPL,
    );
    expect(result).to.be.false;
  });

  it('should return false if module name of (native) api-impl does not contain suffix', () => {
    const result = checkIfModuleNameContainsSuffix(
      fixtures.pkgName,
      ModuleTypes.NATIVE_API_IMPL,
    );
    expect(result).to.be.false;
  });

  it('should return false if module type is not supported', () => {
    const result = checkIfModuleNameContainsSuffix(
      fixtures.pkgName,
      fixtures.moduleTypeNotSupported,
    );
    expect(result).to.be.false;
  });

  fixtures.miniAppNameWithSuffix.forEach(name => {
    it('should return true if module name of mini-app contains suffix', () => {
      const result = checkIfModuleNameContainsSuffix(name, ModuleTypes.MINIAPP);
      expect(result).to.be.true;
    });
  });

  fixtures.apiNameWithSuffix.forEach(name => {
    it('should return true if module name of api contains suffix', () => {
      const result = checkIfModuleNameContainsSuffix(name, ModuleTypes.API);
      expect(result).to.be.true;
    });
  });

  fixtures.apiJsImplNameWithSuffix.forEach(name => {
    it('should return true if module name of (js) api-impl contains suffix', () => {
      const result = checkIfModuleNameContainsSuffix(
        name,
        ModuleTypes.JS_API_IMPL,
      );
      expect(result).to.be.true;
    });
  });

  fixtures.apiNativeImplNameWithSuffix.forEach(name => {
    it('should return true if module name of (native) api-impl contains suffix', () => {
      const result = checkIfModuleNameContainsSuffix(
        name,
        ModuleTypes.NATIVE_API_IMPL,
      );
      expect(result).to.be.true;
    });
  });
});

import * as ModuleTypes from './ModuleTypes';

export function checkIfModuleNameContainsSuffix(
  moduleName: string,
  moduleType: string,
): boolean {
  if (moduleName) {
    switch (moduleType) {
      case ModuleTypes.MINIAPP:
        return moduleName.toUpperCase().indexOf('MINIAPP') > -1;
      case ModuleTypes.API:
        return moduleName.toUpperCase().indexOf('API') > -1;
      case ModuleTypes.JS_API_IMPL:
        return moduleName.toUpperCase().indexOf('APIIMPLJS') > -1;
      case ModuleTypes.NATIVE_API_IMPL:
        return moduleName.toUpperCase().indexOf('APIIMPLNATIVE') > -1;
      default:
        return false;
    }
  }
  return false;
}

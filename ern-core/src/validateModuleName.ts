import * as ModuleTypes from './ModuleTypes';

export function validateModuleName(
  moduleName: string,
  moduleType: string,
): boolean {
  if (moduleType === ModuleTypes.MINIAPP) {
    return /^[a-z][a-z0-9-]+-miniapp$/.test(moduleName);
  } else if (moduleType === ModuleTypes.API) {
    return /^[a-z][a-z0-9-]+-api$/.test(moduleName);
  } else if (moduleType === ModuleTypes.JS_API_IMPL) {
    return /^[a-z][a-z0-9-]+-api-impl(-js)?$/.test(moduleName);
  } else if (moduleType === ModuleTypes.NATIVE_API_IMPL) {
    return /^[a-z][a-z0-9-]+-api-impl(-native)?$/.test(moduleName);
  }
  return false;
}

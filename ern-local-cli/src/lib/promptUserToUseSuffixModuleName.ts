import { ModuleTypes } from 'ern-core'
import inquirer from 'inquirer'

export async function promptUserToUseSuffixModuleName(
  moduleName: string,
  moduleType: string
): Promise<string> {
  let message = ''
  let suffixedModuleName = moduleName
  if (moduleName) {
    switch (moduleType) {
      case ModuleTypes.MINIAPP:
        suffixedModuleName = `${moduleName}MiniApp`
        message = `We recommend suffixing the name of ${moduleName} with MiniApp, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.API:
        suffixedModuleName = `${moduleName}Api`
        message = `We recommend suffixing the name of ${moduleName} with Api, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.JS_API_IMPL:
        suffixedModuleName = `${moduleName}ApiImplJs`
        message = `We recommend suffixing the name of ${moduleName} with ApiImplJs, Do you want to use ${suffixedModuleName}?`
        break
      case ModuleTypes.NATIVE_API_IMPL:
        suffixedModuleName = `${moduleName}ApiImplNative`
        message = `We recommend suffixing the name of ${moduleName} with ApiImplNative, Do you want to use ${suffixedModuleName}?`
        break
      default:
        throw new Error(`Unsupported module type : ${moduleType}`)
    }
  }

  const { useSuffixedModuleName } = await inquirer.prompt([
    <inquirer.Question>{
      default: true,
      message,
      name: 'useSuffixedModuleName',
      type: 'confirm',
    },
  ])

  return useSuffixedModuleName ? suffixedModuleName : moduleName
}

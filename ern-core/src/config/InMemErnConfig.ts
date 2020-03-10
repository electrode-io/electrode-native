import { ErnConfig } from './ErnConfig'

export class InMemErnConfig implements ErnConfig {
  private readonly obj: any

  constructor(public readonly config = {}, public readonly ernRcDir: string) {
    this.obj = config
  }

  public get(key?: string, defaultValue?: any): any {
    const transObj = this.envTransform(this.obj)
    return key
      ? transObj[key] !== undefined
        ? transObj[key]
        : defaultValue
      : JSON.parse(JSON.stringify(transObj))
  }

  public set(key: string, value: any): void {
    this.obj[key] = value
  }

  public del(key: string): boolean {
    if (key && this.obj.hasOwnProperty(key)) {
      delete this.obj[key]
      return true
    }
    return false
  }

  public envTransform(obj: any) {
    let objStr = JSON.stringify(obj)
    objStr = objStr
      // Replace all ${env.[ENV_VAR_KEY]} with resolved values
      .replace(
        /\$\{env\.([^\}]+)\}/g,
        (match: string, envKey: string) => process.env[envKey]!
      )
      // Replace ${PWD} with current process working directory
      .replace(/\$\{PWD\}/g, process.cwd().replace(/\\/g, '\\\\'))
      // Replace ${ERNRC} with directory containing the .ernrc config
      .replace(/\$\{ERNRC\}/g, this.ernRcDir.replace(/\\/g, '\\\\'))
    return JSON.parse(objStr)
  }
}

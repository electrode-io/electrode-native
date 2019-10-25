import { ErnConfig } from './ErnConfig'

export class InMemErnConfig implements ErnConfig {
  private readonly obj: any

  constructor(public readonly config = {}) {
    this.obj = config
  }

  public get(key?: string, defaultValue?: any): any {
    return key
      ? this.obj[key] !== undefined
        ? this.obj[key]
        : defaultValue
      : JSON.parse(JSON.stringify(this.obj))
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
}

import fs from 'fs'
import path from 'path'
import os from 'os'

const ERN_ROOT_PATH = process.env.ERN_HOME || path.join(os.homedir(), '.ern')
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_ROOT_PATH, '.ernrc')
const ERN_RC_LOCAL_FILE_PATH = path.join(process.cwd(), '.ernrc')

export class ErnConfig {
  get obj(): any {
    return fs.existsSync(this.ernRcFilePath)
      ? JSON.parse(fs.readFileSync(this.ernRcFilePath, 'utf-8'))
      : {}
  }

  get ernRcFilePath(): string {
    return fs.existsSync(ERN_RC_LOCAL_FILE_PATH)
      ? ERN_RC_LOCAL_FILE_PATH
      : ERN_RC_GLOBAL_FILE_PATH
  }

  public getValue(key: string, defaultValue?: any): any {
    return this.obj[key] !== undefined ? this.obj[key] : defaultValue
  }

  public setValue(key: string, value: any) {
    const c = this.obj
    c[key] = value
    fs.writeFileSync(this.ernRcFilePath, JSON.stringify(c, null, 2))
  }

  public writeConfig(obj: any) {
    fs.writeFileSync(this.ernRcFilePath, JSON.stringify(obj, null, 2))
  }

  public deleteConfig(key: string): boolean {
    const c = this.obj
    if (key && c.hasOwnProperty(key)) {
      delete c[key]
      fs.writeFileSync(this.ernRcFilePath, JSON.stringify(c, null, 2))
      return true
    }
    return false
  }

  public getAllConfig(): any {
    return this.obj
  }
}

export default new ErnConfig()

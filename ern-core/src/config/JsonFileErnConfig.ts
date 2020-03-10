import { ErnConfig } from './ErnConfig'
import { InMemErnConfig } from './InMemErnConfig'
import fs from 'fs'
import path from 'path'

export class JsonFileErnConfig implements ErnConfig {
  private readonly inMemConfig: InMemErnConfig

  constructor(public readonly jsonFilePath: string) {
    const conf = fs.existsSync(this.jsonFilePath)
      ? JSON.parse(fs.readFileSync(this.jsonFilePath, 'utf-8'))
      : {}
    this.inMemConfig = new InMemErnConfig(conf, path.dirname(jsonFilePath))
  }

  public get(key?: string, defaultValue?: any): any {
    return this.inMemConfig.get(key, defaultValue)
  }

  public set(key: string, value: any): void {
    this.inMemConfig.set(key, value)
    this.persist()
  }

  public del(key: string): boolean {
    const hasDeletedKey = this.inMemConfig.del(key)
    if (hasDeletedKey) {
      this.persist()
    }
    return hasDeletedKey
  }

  private persist() {
    fs.writeFileSync(
      this.jsonFilePath,
      JSON.stringify(this.inMemConfig.get(), null, 2)
    )
  }
}

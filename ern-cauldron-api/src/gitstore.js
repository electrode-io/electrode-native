// @flow

import {
  readJSON,
  writeJSON
} from './fs-util'
import BaseGit from './base-git'
import fs from 'fs'
import path from 'path'

const CAULDRON_FILENAME = 'cauldron.json'

type TypeCauldronMiniApps = {
  container: Array<string>,
  codePush: Array<any>
}

type TypeCauldronVersion = {
  name: string,
  ernPlatormVersion: string,
  isReleased: boolean,
  binary: ?string,
  yarnlock: ?string,
  nativeDeps: Array<string>,
  miniApps: TypeCauldronMiniApps,
  config?: Object,
  containerVersion: string
}

type TypeCauldronPlatform = {
  name: string,
  versions: Array<TypeCauldronVersion>,
  config?: Object
}

type TypeCauldronNativeApp = {
  name: string,
  platforms: Array<TypeCauldronPlatform>,
  config?: Object
}

type TypeCauldron = {
  config?: Object,
  nativeApps: Array<TypeCauldronNativeApp>
}

export default class GitStore extends BaseGit {
  _jsonPath: string
  cauldron: Object

  constructor (
    cauldronPath: string,
    repository: string,
    branch: string = 'master',
    cauldron: Object = {
      'nativeApps': []
    }) {
    super(cauldronPath, repository, branch)
    this._jsonPath = path.resolve(this.path, CAULDRON_FILENAME)
    this.cauldron = cauldron
  }

  async commit (message: string = 'Commit') {
    await writeJSON(this._jsonPath, this.cauldron)
    await this.git.addAsync(CAULDRON_FILENAME)
    await this.git.commitAsync(message)
    if (!this._pendingTransaction) {
      await this.push()
    }
  }

  async getCauldron () : Promise<TypeCauldron> {
    await this.sync()
    if (fs.existsSync(this._jsonPath)) {
      this.cauldron = await readJSON(this._jsonPath)
    }
    return this.cauldron
  }
}

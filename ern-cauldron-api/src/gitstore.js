// @flow

import {
  readJSON,
  writeJSON
} from './fs-util'
import BaseGit from './base-git'
import fs from 'fs'
import path from 'path'

const CAULDRON_FILENAME = 'cauldron.json'

export type CauldronCodePushMetadata = {
  deploymentName: string,
  isMandatory?: boolean,
  appVersion?: string,
  size?: number,
  releaseMethod?: string,
  label?: string,
  releasedBy?: string,
  rollout?: number
}

export type CauldronCodePushEntry = {
  metadata: CauldronCodePushMetadata,
  miniapps: Array<string>
}

type CauldronMiniApps = {
  container: Array<string>,
}

type CauldronNativeAppVersion = {
  name: string,
  ernPlatormVersion: string,
  isReleased: boolean,
  binary: ?string,
  yarnLocks: Object,
  nativeDeps: Array<string>,
  miniApps: CauldronMiniApps,
  codePush: Object,
  config?: Object,
  containerVersion: string
}

type CauldronNativeAppPlatform = {
  name: string,
  versions: Array<CauldronNativeAppVersion>,
  config?: Object
}

type CauldronNativeApp = {
  name: string,
  platforms: Array<CauldronNativeAppPlatform>,
  config?: Object
}

type Cauldron = {
  config?: Object,
  nativeApps: Array<CauldronNativeApp>
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
    if (!this._pendingTransaction) {
      await this.git.commitAsync(message)
      await this.push()
    }
  }

  async getCauldron () : Promise<Cauldron> {
    await this.sync()
    if (fs.existsSync(this._jsonPath)) {
      this.cauldron = await readJSON(this._jsonPath)
    }
    return this.cauldron
  }
}

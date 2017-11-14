// @flow

import Api from './api'
import FileStore from './filestore'
import GitStore from './gitstore'

export default function factory (
  repository: string,
  cauldronPath: string,
  branch: string = 'master') {
  const sourcemapStore = new FileStore(cauldronPath, repository, branch, 'sourcemaps')
  const yarnlockStore = new FileStore(cauldronPath, repository, branch, 'yarnlocks')
  const dbStore = new GitStore(cauldronPath, repository, branch)
  return new Api(dbStore, sourcemapStore, yarnlockStore)
}

export type {
  TypeCauldronCodePushMetadata,
  TypeCauldronCodePushEntry
} from './gitstore'

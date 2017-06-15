// @flow

import Api from './api'
import FileStore from './filestore'
import GitStore from './gitstore'

export default function factory (
  repository: string,
  cauldronPath: string,
  branch: string = 'master') {
  const sourcemapStore = new FileStore(cauldronPath, repository, branch, 'sourcemaps')
  const binaryStore = new FileStore(cauldronPath, repository, branch, 'binaries')
  const dbStore = new GitStore(cauldronPath, repository, branch)
  return new Api(dbStore, binaryStore, sourcemapStore)
}

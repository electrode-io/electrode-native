// @flow

import CauldronApi from './CauldronApi'
import GitFileStore from './GitFileStore'
import GitDocumentStore from './GitDocumentStore'

export function defaultCauldron (repository: string, cauldronPath: string, branch: string = 'master') {
  const sourcemapStore = new GitFileStore(cauldronPath, repository, branch, 'sourcemaps')
  const yarnlockStore = new GitFileStore(cauldronPath, repository, branch, 'yarnlocks')
  const bundleStore = new GitFileStore(cauldronPath, repository, branch, 'bundles')
  const dbStore = new GitDocumentStore(cauldronPath, repository, branch)
  return new CauldronApi(dbStore, sourcemapStore, yarnlockStore, bundleStore)
}

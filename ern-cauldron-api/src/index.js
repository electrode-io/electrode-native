// @flow

import _CauldronApi from './CauldronApi'
import _EphemeralFileStore from './EphemeralFileStore'
import _InMemoryDocumentStore from './InMemoryDocumentStore'
import GitFileStore from './GitFileStore'
import GitDocumentStore from './GitDocumentStore'

export default function factory (
  repository: string,
  cauldronPath: string,
  branch: string = 'master') {
  const sourcemapStore = new GitFileStore(cauldronPath, repository, branch, 'sourcemaps')
  const yarnlockStore = new GitFileStore(cauldronPath, repository, branch, 'yarnlocks')
  const dbStore = new GitDocumentStore(cauldronPath, repository, branch)
  return new _CauldronApi(dbStore, sourcemapStore, yarnlockStore)
}

export const CauldronApi = _CauldronApi
export const EphemeralFileStore = _EphemeralFileStore
export const InMemoryDocumentStore = _InMemoryDocumentStore

export type {
  CauldronCodePushMetadata,
  CauldronCodePushEntry
} from './FlowTypes'

export {
  getSchemaVersionMatchingCauldronApiVersion,
  getCurrentSchemaVersion
} from './util'

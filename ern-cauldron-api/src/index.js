// @flow

import _CauldronApi from './CauldronApi'
import _EphemeralFileStore from './EphemeralFileStore'
import _InMemoryDocumentStore from './InMemoryDocumentStore'
import _GitFileStore from './GitFileStore'
import _GitDocumentStore from './GitDocumentStore'
import _CauldronHelper from './CauldronHelper'
import _getActiveCauldron from './getActiveCauldron'

export const CauldronApi = _CauldronApi
export const EphemeralFileStore = _EphemeralFileStore
export const InMemoryDocumentStore = _InMemoryDocumentStore
export const GitFileStore = _GitFileStore
export const GitDocumentStore = _GitDocumentStore
export const getActiveCauldron = _getActiveCauldron
export const CauldronHelper = _CauldronHelper

export default ({
  CauldronApi: _CauldronApi,
  EphemeralFileStore: _EphemeralFileStore,
  InMemoryDocumentStore: _InMemoryDocumentStore,
  GitFileStore: _GitFileStore,
  GitDocumentStore: _GitDocumentStore,
  getActiveCauldron: _getActiveCauldron,
  CauldronHelper: _CauldronHelper
})

export type {
  CauldronCodePushMetadata,
  CauldronCodePushEntry
} from './FlowTypes'

export {
  getSchemaVersionMatchingCauldronApiVersion,
  getCurrentSchemaVersion
} from './util'

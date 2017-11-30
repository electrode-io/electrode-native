// @flow

import type {
  Cauldron,
  ICauldronDocumentStore
} from './FlowTypes'

export default class InMemoryDocumentStore implements ICauldronDocumentStore {
  _pendingCauldron: Object
  _latestCommitedCauldron: Object
  _latestCommitMessage: string | Array<string>
  _isPendingTransaction: boolean

  constructor (cauldron: Object) {
    this._pendingCauldron = cauldron
    this._isPendingTransaction = false
  }

  // ===========================================================
  // ICauldronDocumentAccess implementation
  // ===========================================================

  async commit (message: string | Array<string>) {
    if (!this._isPendingTransaction) {
      this._latestCommitedCauldron = this._pendingCauldron
      this._latestCommitMessage = message
    }
    return Promise.resolve()
  }

  async getCauldron () : Promise<Cauldron> {
    return Promise.resolve(this._pendingCauldron)
  }

  // ===========================================================
  // ITransactional implementation
  // ===========================================================

  async beginTransaction () {
    this._isPendingTransaction = true
    return Promise.resolve()
  }

  async commitTransaction (message: string | Array<string>) {
    this._isPendingTransaction = false
    return this.commit(message)
  }

  async discardTransaction () {
    this._isPendingTransaction = false
    return Promise.resolve()
  }
}

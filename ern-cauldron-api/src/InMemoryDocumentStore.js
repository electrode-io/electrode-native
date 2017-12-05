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
    if (!cauldron) {
      throw new Error('A Cauldron document object must be provided')
    }
    this._pendingCauldron = cauldron
    this._isPendingTransaction = false
  }

  get latestCommitedCauldron () : Object {
    return this._latestCommitedCauldron
  }

  get isPendingTransaction () : boolean {
    return this._isPendingTransaction
  }

  get latestCommitMessage () : string | Array<string> {
    return this._latestCommitMessage
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
    if (this._isPendingTransaction) {
      this._isPendingTransaction = false
      return this.commit(message)
    }
  }

  async discardTransaction () {
    this._isPendingTransaction = false
    return Promise.resolve()
  }
}

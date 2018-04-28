import { Cauldron, ICauldronDocumentStore } from './FlowTypes'

export default class InMemoryDocumentStore implements ICauldronDocumentStore {
  public latestCommitedCauldron: any
  public latestCommitMessage: string | string[]
  public isPendingTransaction: boolean
  private readonly pendingCauldron: Cauldron

  constructor(cauldron: Cauldron) {
    if (!cauldron) {
      throw new Error('A Cauldron document object must be provided')
    }
    this.pendingCauldron = cauldron
    this.isPendingTransaction = false
  }

  // ===========================================================
  // ICauldronDocumentAccess implementation
  // ===========================================================

  public async commit(message: string | string[]) {
    if (!this.isPendingTransaction) {
      this.latestCommitedCauldron = this.pendingCauldron
      this.latestCommitMessage = message
    }
    return Promise.resolve()
  }

  public async getCauldron(): Promise<Cauldron> {
    return Promise.resolve(this.pendingCauldron)
  }

  // ===========================================================
  // ITransactional implementation
  // ===========================================================

  public async beginTransaction() {
    this.isPendingTransaction = true
    return Promise.resolve()
  }

  public async commitTransaction(message: string | string[]) {
    if (this.isPendingTransaction) {
      this.isPendingTransaction = false
      return this.commit(message)
    }
  }

  public async discardTransaction() {
    this.isPendingTransaction = false
    return Promise.resolve()
  }
}

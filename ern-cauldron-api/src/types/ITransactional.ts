export interface ITransactional {
  beginTransaction(): Promise<void>;
  commitTransaction(message: string | string[]): Promise<void>;
  discardTransaction(): Promise<void>;
}

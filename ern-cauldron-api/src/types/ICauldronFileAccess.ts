export interface ICauldronFileAccess {
  storeFile(filename: string, payload: string | Buffer): Promise<void>
  hasFile(filename: string): Promise<boolean>
  getPathToFile(filename: string): Promise<string | void>
  getFile(filename: string): Promise<Buffer | void>
  removeFile(filename: string): Promise<boolean>
}

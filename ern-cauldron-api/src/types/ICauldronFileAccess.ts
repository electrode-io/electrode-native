export interface ICauldronFileAccess {
  storeFile(
    filename: string,
    payload: string | Buffer,
    fileMode?: string
  ): Promise<void>
  hasFile(filename: string): Promise<boolean>
  getPathToFile(filename: string): Promise<string | undefined>
  getFile(filename: string): Promise<Buffer | undefined>
  removeFile(filename: string): Promise<boolean>
}

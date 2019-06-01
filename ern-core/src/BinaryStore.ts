import { AppVersionDescriptor } from './descriptors'

export interface BinaryStore {
  addBinary(
    descriptor: AppVersionDescriptor,
    binary: any
  ): Promise<string | Buffer>
  removeBinary(descriptor: AppVersionDescriptor): Promise<string | Buffer>
  getBinary(descriptor: AppVersionDescriptor, options: any): Promise<string>
  hasBinary(descriptor: AppVersionDescriptor): Promise<string | Buffer>
}

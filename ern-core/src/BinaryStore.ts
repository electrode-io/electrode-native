import { AppVersionDescriptor } from './descriptors';

export interface BinaryStore {
  addBinary(descriptor: AppVersionDescriptor, binary: any): Promise<void>;
  removeBinary(descriptor: AppVersionDescriptor): Promise<void>;
  getBinary(descriptor: AppVersionDescriptor, options: any): Promise<string>;
  hasBinary(descriptor: AppVersionDescriptor): Promise<boolean>;
}

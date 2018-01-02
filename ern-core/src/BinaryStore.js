// @flow

import NativeApplicationDescriptor from './NativeApplicationDescriptor'

export interface BinaryStore {
  addBinary (descriptor: NativeApplicationDescriptor, binary: any) : Promise<string | Buffer>;
  removeBinary (descriptor: NativeApplicationDescriptor) : Promise<string | Buffer>;
  getBinary (descriptor: NativeApplicationDescriptor, options: Object) : Promise<string>;
  hasBinary (descriptor: NativeApplicationDescriptor) : Promise<string | Buffer>;
}

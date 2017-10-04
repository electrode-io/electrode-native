// @flow

import {
  NativeApplicationDescriptor
} from 'ern-util'

export interface BinaryStore {
  addBinary (descriptor: NativeApplicationDescriptor, binary: any) : Promise<boolean>;
  removeBinary (descriptor: NativeApplicationDescriptor) : Promise<boolean>;
  getBinary (descriptor: NativeApplicationDescriptor, options: Object) : Promise<string>;
  hasBinary (descriptor: NativeApplicationDescriptor) : Promise<boolean>;
}

// @flow

import noop from './noop'

export default class NativeApplicationDescriptor {
  _name: string
  _platform: ?string
  _version: ?string

  constructor (
    name: string,
    platform?: string,
    version?: string) {
    this._name = name
    this._platform = platform
    this._version = version
  }

  get name () : string {
    return this._name
  }

  get platform () : ?string {
    return this._platform
  }

  get version () : ?string {
    return this._version
  }

  get isComplete () : boolean {
    return (this._platform !== undefined) && (this._version !== undefined)
  }

  get isPartial () : boolean {
    return (this._platform === undefined) || (this._version === undefined)
  }

  static fromString (napDescriptorLiteral: string) : NativeApplicationDescriptor {
    return new NativeApplicationDescriptor(...napDescriptorLiteral.split(':'))
  }

  toString () : string {
    let str = this._name
    this._platform ? str += `:${this._platform}` : noop()
    this._version ? str += `:${this._version}` : noop()
    return str
  }
}

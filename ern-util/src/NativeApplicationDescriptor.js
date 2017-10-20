// @flow

export default class NativeApplicationDescriptor {
  _name: string
  _platform: ?string
  _version: ?string

  constructor (
    name: string,
    platform: ?string,
    version: ?string) {
    if (!name) {
      throw new Error('[NativeApplicationDescriptor] name is required')
    }
    if (!platform && version) {
      throw new Error('[NativeApplicationDescriptor] platform is required when providing version')
    }
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
    str += this._platform ? `:${this._platform}` : ''
    str += this._version ? `:${this._version}` : ''
    return str
  }
}

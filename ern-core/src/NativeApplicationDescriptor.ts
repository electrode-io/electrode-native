import { NativePlatform } from './NativePlatform'

export class NativeApplicationDescriptor {
  public static fromString(
    napDescriptorLiteral: string,
    { throwIfNotComplete }: { throwIfNotComplete?: boolean } = {}
  ): NativeApplicationDescriptor {
    const arr: string[] = napDescriptorLiteral.split(':')
    const result = new NativeApplicationDescriptor(
      arr[0],
      arr[1] as NativePlatform,
      arr[2]
    )
    if (throwIfNotComplete && !result.isComplete) {
      throw new Error(
        `${result.toString()} is not a complete Native Application Descriptor`
      )
    }
    return result
  }

  public readonly name: string
  public readonly platform?: NativePlatform
  public readonly version?: string

  constructor(name: string, platform?: NativePlatform, version?: string) {
    if (!name) {
      throw new Error('[NativeApplicationDescriptor] name is required')
    }
    if (!platform && version) {
      throw new Error(
        '[NativeApplicationDescriptor] platform is required when providing version'
      )
    }
    this.name = name
    this.platform = platform
    this.version = version
  }

  public get isComplete(): boolean {
    return this.platform !== undefined && this.version !== undefined
  }

  public get isPartial(): boolean {
    return this.platform === undefined || this.version === undefined
  }

  public withoutVersion(): NativeApplicationDescriptor {
    return new NativeApplicationDescriptor(this.name, this.platform)
  }

  public toString(): string {
    let str = this.name
    str += this.platform ? `:${this.platform}` : ''
    str += this.version ? `:${this.version}` : ''
    return str
  }
}

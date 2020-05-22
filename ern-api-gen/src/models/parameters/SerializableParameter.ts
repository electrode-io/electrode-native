import { Parameter } from './Parameter'

export class SerializableParameter extends Parameter {
  public copy() {
    const res = new SerializableParameter()
    res.required = this.required
    res.vendorExtensions = this.vendorExtensions
    res.uniqueItems = this.uniqueItems
    res.exclusiveMinimum = this.exclusiveMinimum
    res.exclusiveMaximum = this.exclusiveMaximum
    res.format = this.format
    res.in = this.in
    res.readOnly = this.readOnly
    res.defaultValue = this.defaultValue
    return res
  }
}

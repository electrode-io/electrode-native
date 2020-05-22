/* tslint:disable:variable-name */
import { BooleanProperty, StringProperty } from './models/properties'
import { newHashMap } from './java/javaUtil'
import StringBuilder from './java/StringBuilder'

export default class CliOption {
  public static newBoolean(opt, description) {
    return new CliOption(opt, description, BooleanProperty.TYPE).defaultValue(
      'false'
    )
  }

  public static newString(opt, description) {
    return new CliOption(opt, description, StringProperty.TYPE)
  }

  private opt
  private description
  private enumValues
  private type
  private __defaultValue

  public constructor(
    opt,
    description,
    type = StringProperty.TYPE,
    short?: any,
    enumValues?: any,
    required?: any
  ) {
    this.opt = opt
    this.description = description
    this.type = type
  }

  public getOpt() {
    return this.opt
  }

  public getDescription() {
    return this.description
  }

  public setDescription(description) {
    this.description = description
  }

  public getType() {
    return this.type
  }

  public setType(type) {
    this.type = type
  }

  public getDefault() {
    return this.__defaultValue
  }

  public setDefault(defaultValue) {
    this.__defaultValue = defaultValue
  }

  public defaultValue(defaultValue) {
    this.__defaultValue = defaultValue
    return this
  }

  public addEnum(value, description) {
    if (this.enumValues == null) {
      this.enumValues = newHashMap()
    }
    if (!this.enumValues.containsKey(value)) {
      this.enumValues.put(value, description)
    }
    return this
  }

  public getEnum() {
    return this.enumValues
  }

  public setEnum(enumValues) {
    this.enumValues = enumValues
  }

  public getOptionHelp() {
    const sb = StringBuilder(this.description)
    if (this.__defaultValue != null) {
      sb.append(' (Default: ')
        .append(this.__defaultValue)
        .append(')')
    }
    if (this.enumValues != null) {
      for (const [key, value] of this.enumValues) {
        sb.append('\n    ')
          .append(key)
          .append(' - ')
          .append(value)
      }
    }
    return sb.toString()
  }
}

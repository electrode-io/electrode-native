import {BooleanProperty} from './models/properties'
import {StringProperty} from './models/properties'
import {newHashMap} from './java/javaUtil'
import StringBuilder from './java/StringBuilder'

export default class CliOption {
  static newBoolean (opt, description) {
    return new CliOption(opt, description, BooleanProperty.TYPE).defaultValue('false')
  }

  static newString (opt, description) {
    return new CliOption(opt, description, StringProperty.TYPE)
  }

  constructor (opt, description, type = StringProperty.TYPE, short, enumValues, required) {
    this.opt = opt
    this.description = description
    this.type = type
  }

  getOpt () {
    return this.opt
  }

  getDescription () {
    return this.description
  }

  setDescription (description) {
    this.description = description
  }

  getType () {
    return this.type
  }

  setType (type) {
    this.type = type
  }

  getDefault () {
    return this.__defaultValue
  }

  setDefault (defaultValue) {
    this.__defaultValue = defaultValue
  }

  defaultValue (defaultValue) {
    this.__defaultValue = defaultValue
    return this
  }

  addEnum (value, description) {
    if (this.enumValues == null) {
      this.enumValues = newHashMap()
    }
    if (!this.enumValues.containsKey(value)) {
      this.enumValues.put(value, description)
    }
    return this
  }

  getEnum () {
    return this.enumValues
  }

  setEnum (enumValues) {
    this.enumValues = enumValues
  }

  getOptionHelp () {
    let sb = new StringBuilder(this.description)
    if (this.__defaultValue != null) {
      sb.append(' (Default: ').append(this.__defaultValue).append(')')
    }
    if (this.enumValues != null) {
      for (const [key, value] of this.enumValues) {
        sb.append('\n    ').append(key).append(' - ').append(value)
      }
    }
    return sb.toString()
  }
}

/* Generated from Java with JSweet 1.2.0 - http://www.jsweet.org */
/* tslint:disable:variable-name */
export default class AuthorizationValue {
  public __value;
  public __type;
  public __keyName;

  constructor(keyName, value, type) {
    this.keyName(keyName)
      .value(value)
      .type(type);
  }

  public value(value) {
    this.setValue(value);
    return this;
  }

  public type(type) {
    this.setType(type);
    return this;
  }

  public keyName(keyName) {
    this.setKeyName(keyName);
    return this;
  }

  public getValue() {
    return this.__value;
  }

  public setValue(value) {
    this.__value = value;
  }

  public getType() {
    return this.__type;
  }

  public setType(type) {
    this.__type = type;
  }

  public getKeyName() {
    return this.__keyName;
  }

  public setKeyName(keyName) {
    this.__keyName = keyName;
  }
}

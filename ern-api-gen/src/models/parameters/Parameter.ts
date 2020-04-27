import { newHashMap } from '../../java/javaUtil';

export class Parameter {
  public required = false;
  public vendorExtensions = newHashMap();
  public uniqueItems;
  public exclusiveMinimum;
  public exclusiveMaximum;
  public format;
  public in;
  public readOnly;
  public defaultValue;

  public isUniqueItems() {
    return this.uniqueItems;
  }

  public isExclusiveMinimum() {
    return this.exclusiveMinimum != null;
  }

  public isExclusiveMaximum() {
    return this.exclusiveMaximum != null;
  }

  public setFormat(format) {
    this.format = format;
  }

  public getFormat() {
    return this.format;
  }

  public getIn() {
    return this.in;
  }

  public isReadOnly() {
    return this.readOnly;
  }

  public setVendorExtension(name, value) {
    if (name.startsWith('-x')) {
      this.vendorExtensions.put(name, value);
    }
  }

  public getVendorExtensions() {
    return this.vendorExtensions;
  }

  public getDefaultValue() {
    return this.defaultValue;
  }

  public setDefaultValue(defaultValue) {
    this.defaultValue = defaultValue;
  }

  public getDefault() {
    if (this.defaultValue == null || this.defaultValue.length === 0) {
      return null;
    }

    return this.defaultValue;
  }

  public setDefault(defaultValue) {
    this.defaultValue = defaultValue == null ? null : defaultValue.toString();
  }

  public copy() {
    const res = new Parameter();
    res.required = this.required;
    res.vendorExtensions = this.vendorExtensions;
    res.uniqueItems = this.uniqueItems;
    res.exclusiveMinimum = this.exclusiveMinimum;
    res.exclusiveMaximum = this.exclusiveMaximum;
    res.format = this.format;
    res.in = this.in;
    res.readOnly = this.readOnly;
    res.defaultValue = this.defaultValue;
    return res;
  }
}

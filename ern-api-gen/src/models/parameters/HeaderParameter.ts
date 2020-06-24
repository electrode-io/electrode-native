import { SerializableParameter } from './SerializableParameter';

export class HeaderParameter extends SerializableParameter {
  public static TYPE = 'header';

  public copy() {
    const res = new HeaderParameter();
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

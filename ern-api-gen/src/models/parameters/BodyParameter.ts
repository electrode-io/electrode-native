import { Parameter } from './Parameter';
import { toModel } from '../PropertyBuilder';

export class BodyParameter extends Parameter {
  public static TYPE = 'body';
  public schema;

  public getSchema() {
    return this.schema;
  }

  public setSchema(schema) {
    this.schema = toModel(schema);
  }

  public copy() {
    const res = new BodyParameter();
    res.required = this.required;
    res.vendorExtensions = this.vendorExtensions;
    res.uniqueItems = this.uniqueItems;
    res.exclusiveMinimum = this.exclusiveMinimum;
    res.exclusiveMaximum = this.exclusiveMaximum;
    res.format = this.format;
    res.in = this.in;
    res.readOnly = this.readOnly;
    res.defaultValue = this.defaultValue;
    res.schema = this.schema;
    return res;
  }
}

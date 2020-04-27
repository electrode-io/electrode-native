import { Parameter } from './Parameter';
import RefType from '../refs/RefType';
import GenericRef from '../refs/GenericRef';

export class RefParameter extends Parameter {
  public static TYPE = 'ref';
  public genericRef;

  constructor({ $ref }: { $ref?: any } = {}) {
    super();
    this.set$ref($ref);
  }

  public asDefault(ref) {
    this.set$ref(RefType.PARAMETER.getInternalPrefix() + ref);
    return this;
  }

  public set$ref(ref) {
    this.genericRef = new GenericRef(RefType.PARAMETER, ref);
  }

  public getRefFormat() {
    return this.genericRef.getFormat();
  }

  public getSimpleRef() {
    return this.genericRef.getSimpleRef();
  }

  public copy() {
    const res = new RefParameter();
    res.required = this.required;
    res.vendorExtensions = this.vendorExtensions;
    res.uniqueItems = this.uniqueItems;
    res.exclusiveMinimum = this.exclusiveMinimum;
    res.exclusiveMaximum = this.exclusiveMaximum;
    res.format = this.format;
    res.in = this.in;
    res.readOnly = this.readOnly;
    res.defaultValue = this.defaultValue;
    res.required = this.required;
    res.genericRef = this.genericRef;
    return res;
  }
}

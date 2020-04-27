import { Property } from './Property';
import GenericRef from '../refs/GenericRef';
import RefType from '../refs/RefType';

export class RefProperty extends Property {
  public static TYPE = 'ref';
  public static allowedProps = [...Property.allowedProps, '$ref'];

  public genericRef;

  constructor(ref) {
    super();
    if (ref && ref.$ref) {
      this.set$ref(ref.$ref);
    } else if (typeof ref === 'string') {
      this.set$ref(ref);
    }
  }

  public set$ref(ref) {
    this.genericRef = new GenericRef(RefType.DEFINITION, ref);
  }

  public get$ref() {
    return this.genericRef.getRef();
  }

  public asDefault(ref) {
    this.set$ref(RefType.DEFINITION.getInternalPrefix() + ref);
    return this;
  }

  public getSimpleRef() {
    if (this.genericRef != null) {
      const simp = this.genericRef.getSimpleRef();
      return simp;
    }
  }

  public getRefFormat() {
    if (this.genericRef != null) {
      return this.genericRef.getFormat();
    }
  }
}
